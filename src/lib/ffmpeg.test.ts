import { expect, test } from "vitest";
import { probe } from "./ffmpeg";

test("probe rejects a non-video file", async () => {
  await expect(probe("package.json")).rejects.toThrow("Not a video file");
});

test("probeDuration reads the length of an audio-only file", async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { probeDuration, runFfmpeg } = await import("./ffmpeg");
  const audio = join(mkdtempSync(join(tmpdir(), "saymo-audio-")), "tone.wav");
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440",
    "-t",
    "2",
    "-c:a",
    "pcm_s16le",
    audio,
  ]);
  expect(await probeDuration(audio)).toBeGreaterThanOrEqual(1900);
  await expect(probe(audio)).rejects.toThrow("Not a video file");
});
