import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { probe, runFfmpeg } from "../../lib/ffmpeg";
import type { Shot } from "../../video/schema/content";
import type { MediaInfo } from "../../video/schema/media";

export type IngestResult = {
  info: MediaInfo;
  audioPath: string;
  keyframes: { tMs: number; path: string }[];
  shots: Shot[];
};

const keyframeStepMs = 2000;
const keyframeWidth = 640;
const sceneThreshold = 0.3;

export function parseSceneTimestamps(stderr: string): number[] {
  return [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((match) =>
    Math.round(Number(match[1]) * 1000),
  );
}

export function shotsFromCuts(cutsMs: number[], durationMs: number): Shot[] {
  const boundaries = [
    0,
    ...cutsMs.filter((cut) => cut > 0 && cut < durationMs),
    durationMs,
  ];
  const shots: Shot[] = [];
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
): Promise<{ tMs: number; path: string }[]> {
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
  const audioPath = join(input.runDir, "audio.wav");
  const [keyframes, cuts] = await Promise.all([
    extractKeyframes(input.source, join(input.runDir, "frames")),
    detectCuts(input.source),
    extractAudio(input.source, audioPath),
  ]);
  return {
    info,
    audioPath,
    keyframes,
    shots: shotsFromCuts(cuts, info.durationMs),
  };
}
