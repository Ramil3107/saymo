import { copyFile, mkdir, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { z } from "zod";
import { probe, runFfmpeg } from "../../lib/ffmpeg";
import { type Shot, ShotSchema } from "../../video/schema/content";
import { MediaInfoSchema } from "../../video/schema/media";

export const IngestResultSchema = z.object({
  info: MediaInfoSchema,
  sourcePath: z.string(),
  audioPath: z.string().optional(),
  keyframes: z.array(z.object({ tMs: z.number(), path: z.string() })),
  shots: z.array(ShotSchema),
});

export type IngestResult = z.infer<typeof IngestResultSchema>;

type Keyframe = IngestResult["keyframes"][number];

const keyframeStepMs = 2000;
const keyframeWidth = 640;
const sceneThreshold = 0.3;

export async function ingest(input: { source: string; runDir: string }): Promise<IngestResult> {
  const info = await probe(input.source);
  await mkdir(input.runDir, { recursive: true });

  const sourcePath = join(input.runDir, `source${extname(input.source) || ".mp4"}`);
  await copyFile(input.source, sourcePath);

  const audioPath = info.hasAudio ? join(input.runDir, "audio.wav") : undefined;
  const [keyframes, cuts] = await Promise.all([
    extractKeyframes(sourcePath, join(input.runDir, "frames")),
    detectCuts(sourcePath),
    audioPath ? extractAudio(sourcePath, audioPath) : undefined,
  ]);

  return { info, sourcePath, audioPath, keyframes, shots: shotsFromCuts(cuts, info.durationMs) };
}

export function shotsFromCuts(cutsMs: number[], durationMs: number): Shot[] {
  const inside = cutsMs.filter((cut) => cut > 0 && cut < durationMs);
  const boundaries = [0, ...inside, durationMs];
  const shots: Shot[] = [];

  boundaries.slice(1).forEach((endMs, index) => {
    const startMs = boundaries[index] ?? 0;
    if (endMs > startMs) shots.push({ index: shots.length, startMs, endMs });
  });

  return shots;
}

export function parseSceneTimestamps(stderr: string): number[] {
  return [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((match) => Math.round(Number(match[1]) * 1000));
}

async function extractKeyframes(source: string, framesDir: string): Promise<Keyframe[]> {
  await mkdir(framesDir, { recursive: true });

  const everySeconds = keyframeStepMs / 1000;
  const sampling = ["-vf", `fps=1/${everySeconds},scale=${keyframeWidth}:-2`, "-q:v", "3"];
  await runFfmpeg(["-y", "-i", source, ...sampling, join(framesDir, "%04d.jpg")]);

  const files = (await readdir(framesDir)).filter((name) => name.endsWith(".jpg")).sort();

  return files.map((name, index) => ({ tMs: index * keyframeStepMs, path: join(framesDir, name) }));
}

async function detectCuts(source: string): Promise<number[]> {
  const sceneFilter = ["-vf", `select='gt(scene,${sceneThreshold})',showinfo`, "-fps_mode", "vfr"];
  const { stderr } = await runFfmpeg(["-i", source, ...sceneFilter, "-f", "null", "-"]);

  return parseSceneTimestamps(stderr);
}

async function extractAudio(source: string, audioPath: string): Promise<void> {
  const mono16k = ["-vn", "-ac", "1", "-ar", "16000"];
  await runFfmpeg(["-y", "-i", source, ...mono16k, audioPath]);
}
