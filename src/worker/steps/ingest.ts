import { copyFile, mkdir } from "node:fs/promises";
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
const minShotMs = 400;
const minKeyframeGapMs = 600;
const endMarginMs = 200;
const keyframeWidth = 640;
const extractConcurrency = 4;
const sceneThreshold = 0.3;

export async function ingest(input: { source: string; runDir: string }): Promise<IngestResult> {
  const info = await probe(input.source);
  await mkdir(input.runDir, { recursive: true });

  const sourcePath = join(input.runDir, `source${extname(input.source) || ".mp4"}`);
  await copyFile(input.source, sourcePath);

  const audioPath = info.hasAudio ? join(input.runDir, "audio.wav") : undefined;
  const [cuts] = await Promise.all([
    detectCuts(sourcePath),
    audioPath ? extractAudio(sourcePath, audioPath) : undefined,
  ]);
  const shots = shotsFromCuts(cuts, info.durationMs);

  const times = keyframeTimes(shots, info.durationMs);
  const keyframes = await extractKeyframes(sourcePath, join(input.runDir, "frames"), times);

  return { info, sourcePath, audioPath, keyframes, shots };
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

// Every two seconds and once inside every shot, so a short close-up between two samples still has its faces;
// none in the last moment, where a seek can land past the final frame.
export function keyframeTimes(shots: Shot[], durationMs: number): number[] {
  const periodic = Array.from(
    { length: Math.ceil(durationMs / keyframeStepMs) },
    (_, i) => i * keyframeStepMs,
  );
  const midpoints = shots
    .filter((shot) => shot.endMs - shot.startMs >= minShotMs)
    .map((shot) => Math.round((shot.startMs + shot.endMs) / 2));

  const lastMs = durationMs - endMarginMs;
  const times: number[] = [];
  for (const tMs of [...periodic, ...midpoints].filter((t) => t <= lastMs).sort((a, b) => a - b)) {
    const last = times.at(-1);
    if (last === undefined || tMs - last >= minKeyframeGapMs) times.push(tMs);
  }

  return times;
}

export function parseSceneTimestamps(stderr: string): number[] {
  return [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((match) => Math.round(Number(match[1]) * 1000));
}

async function extractKeyframes(source: string, framesDir: string, times: number[]): Promise<Keyframe[]> {
  await mkdir(framesDir, { recursive: true });
  const keyframes = times.map((tMs, index) => ({ tMs, path: join(framesDir, frameName(index)) }));

  for (let start = 0; start < keyframes.length; start += extractConcurrency) {
    const group = keyframes.slice(start, start + extractConcurrency);
    await Promise.all(group.map((keyframe) => extractFrame(source, keyframe)));
  }

  return keyframes;
}

function frameName(index: number): string {
  return `${String(index + 1).padStart(4, "0")}.jpg`;
}

// Seeking before the input lands on the exact frame; the fps filter would take the last frame of each interval.
async function extractFrame(source: string, keyframe: Keyframe): Promise<void> {
  const seek = ["-ss", (keyframe.tMs / 1000).toFixed(3)];
  const single = ["-frames:v", "1", "-vf", `scale=${keyframeWidth}:-2`, "-q:v", "3"];
  await runFfmpeg(["-y", ...seek, "-i", source, ...single, keyframe.path]);
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
