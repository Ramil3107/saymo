import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { runFfmpeg } from "../lib/ffmpeg";
import { readJson, writeJson } from "../lib/json";
import type { CaptionLabProps } from "../video/remotion/lab/captionLabProps";
import { PlanSchema } from "../video/schema/plan";
import { TranscriptSchema } from "../video/schema/transcript";
import { VideoDocSchema } from "../video/schema/video";

const publicDir = "runs/lab/public";
const footageName = "caption-footage.mp4";
const stillName = "subject.jpg";
const stillFrame = "0003.jpg";
const propsPath = "runs/lab/caption-lab.json";
const panelWidth = 540;

await main();

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      run: { type: "string", default: "face-v2" },
      from: { type: "string", default: "0" },
      seconds: { type: "string", default: "9" },
    },
  });
  const runDir = join("runs", values.run);
  const fromMs = Number(values.from) * 1000;
  const durationMs = Number(values.seconds) * 1000;

  await mkdir(publicDir, { recursive: true });
  await cutFootage(join(runDir, "source.mp4"), fromMs, durationMs);
  await copyStill(join(runDir, "frames", stillFrame));
  await writeJson(propsPath, await labProps(runDir, fromMs, durationMs));
  console.log(
    `lab assets: ${values.run} from ${fromMs} ms for ${durationMs} ms in ${publicDir}, props in ${propsPath}`,
  );
}

async function cutFootage(source: string, fromMs: number, durationMs: number): Promise<void> {
  const window = ["-ss", String(fromMs / 1000), "-t", String(durationMs / 1000)];
  const video = ["-vf", `scale=${panelWidth}:-2`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20"];

  await runFfmpeg(["-y", ...window, "-i", source, ...video, "-c:a", "aac", join(publicDir, footageName)]);
}

async function copyStill(frame: string): Promise<void> {
  await runFfmpeg([
    "-y",
    "-i",
    frame,
    "-vf",
    `scale=${panelWidth}:-2`,
    "-q:v",
    "3",
    join(publicDir, stillName),
  ]);
}

async function labProps(runDir: string, fromMs: number, durationMs: number): Promise<CaptionLabProps> {
  const transcript = await readJson(join(runDir, "transcript.json"), TranscriptSchema);
  const plan = await readJson(join(runDir, "plan.json"), PlanSchema);
  const doc = await readJson(join(runDir, "video.json"), VideoDocSchema);
  const words = transcript.words
    .filter((word) => word.startMs >= fromMs && word.endMs <= fromMs + durationMs)
    .map((word) => ({ ...word, startMs: word.startMs - fromMs, endMs: word.endMs - fromMs }));

  return {
    footage: footageName,
    durationMs,
    words,
    keywords: plan.captions.keywords,
    colors: doc.brand.colors,
    register: doc.register,
  };
}
