import { copyFile, mkdir, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { z } from "zod";
import { probe, runFfmpeg } from "../../lib/ffmpeg";
import { ShotSchema } from "../../video/schema/content";
import { MediaInfoSchema } from "../../video/schema/media";

export const IngestResultSchema = z.object({
  info: MediaInfoSchema,
  sourcePath: z.string(),
  audioPath: z.string().optional(),
  keyframes: z.array(z.object({ tMs: z.number(), path: z.string() })),
  shots: z.array(ShotSchema),
});
export type IngestResult = z.infer<typeof IngestResultSchema>;

const keyframeStepMs = 2000;
const keyframeWidth = 640;
const sceneThreshold = 0.3;

export function parseSceneTimestamps(stderr: string): number[] {
  return [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((match) =>
    Math.round(Number(match[1]) * 1000),
  );
}

export function shotsFromCuts(
  cutsMs: number[],
  durationMs: number,
): IngestResult["shots"] {
  const boundaries = [
    0,
    ...cutsMs.filter((cut) => cut > 0 && cut < durationMs),
    durationMs,
  ];
  const shots: IngestResult["shots"] = [];
  for (let i = 1; i < boundaries.length; i += 1) {
    const startMs = boundaries[i - 1] as number;
    const endMs = boundaries[i] as number;
    if (endMs > startMs) shots.push({ index: shots.length, startMs, endMs });
  }
  return shots;
}

async function extractAudio(source: string, audioPath: string): Promise<void> {
  await runFfmpeg([
    "-y",
    "-i",
    source,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    audioPath,
  ]);
}

async function extractKeyframes(
  source: string,
  framesDir: string,
): Promise<IngestResult["keyframes"]> {
  await mkdir(framesDir, { recursive: true });
  await runFfmpeg([
    "-y",
    "-i",
    source,
    "-vf",
    `fps=1/${keyframeStepMs / 1000},scale=${keyframeWidth}:-2`,
    "-q:v",
    "3",
    join(framesDir, "%04d.jpg"),
  ]);
  const files = (await readdir(framesDir))
    .filter((name) => name.endsWith(".jpg"))
    .sort();
  return files.map((name, index) => ({
    tMs: index * keyframeStepMs,
    path: join(framesDir, name),
  }));
}

async function detectCuts(source: string): Promise<number[]> {
  const { stderr } = await runFfmpeg([
    "-i",
    source,
    "-vf",
    `select='gt(scene,${sceneThreshold})',showinfo`,
    "-fps_mode",
    "vfr",
    "-f",
    "null",
    "-",
  ]);
  return parseSceneTimestamps(stderr);
}

export async function ingest(input: {
  source: string;
  runDir: string;
}): Promise<IngestResult> {
  const info = await probe(input.source);
  await mkdir(input.runDir, { recursive: true });
  const sourcePath = join(
    input.runDir,
    `source${extname(input.source) || ".mp4"}`,
  );
  await copyFile(input.source, sourcePath);
  const audioPath = info.hasAudio ? join(input.runDir, "audio.wav") : undefined;
  const [keyframes, cuts] = await Promise.all([
    extractKeyframes(sourcePath, join(input.runDir, "frames")),
    detectCuts(sourcePath),
    audioPath ? extractAudio(sourcePath, audioPath) : Promise.resolve(),
  ]);
  return {
    info,
    sourcePath,
    ...(audioPath ? { audioPath } : {}),
    keyframes,
    shots: shotsFromCuts(cuts, info.durationMs),
  };
}
