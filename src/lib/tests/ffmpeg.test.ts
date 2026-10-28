import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { probe, probeDuration, runFfmpeg } from "../ffmpeg";

test("probe rejects a non-video file", async () => {
  await expect(probe("package.json")).rejects.toThrow("Not a video file");
});

test("probeDuration reads the length of an audio-only file", async () => {
  const audio = join(mkdtempSync(join(tmpdir(), "saymo-audio-")), "tone.wav");
  await runFfmpeg(["-y", "-f", "lavfi", "-i", "sine=frequency=440", "-t", "2", "-c:a", "pcm_s16le", audio]);

  expect(await probeDuration(audio)).toBeGreaterThanOrEqual(1900);
  await expect(probe(audio)).rejects.toThrow("Not a video file");
});
