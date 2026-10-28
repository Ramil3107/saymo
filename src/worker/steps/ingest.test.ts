import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { makeTestVideo } from "../../lib/ffmpeg";
import { ingest, parseSceneTimestamps, shotsFromCuts } from "./ingest";

test("parseSceneTimestamps reads pts_time from showinfo", () => {
  const stderr =
    "[Parsed_showinfo_1 @ 0x1] n:0 pts:90000 pts_time:3 ...\n[Parsed_showinfo_1 @ 0x1] n:1 pts:270000 pts_time:9.5 ...";
  expect(parseSceneTimestamps(stderr)).toEqual([3000, 9500]);
});

test("shotsFromCuts covers the whole duration", () => {
  expect(shotsFromCuts([3000, 9500], 12000)).toEqual([
    { index: 0, startMs: 0, endMs: 3000 },
    { index: 1, startMs: 3000, endMs: 9500 },
    { index: 2, startMs: 9500, endMs: 12000 },
  ]);
});

test("ingest extracts audio, keyframes and shots from a synthetic video", async () => {
  const dir = mkdtempSync(join(tmpdir(), "saymo-ingest-"));
  const src = join(dir, "source.mp4");
  await makeTestVideo(src, 6);
  const result = await ingest({ source: src, runDir: join(dir, "run") });
  expect(result.info.durationMs).toBeGreaterThanOrEqual(5900);
  expect(result.keyframes.map((k) => k.tMs)).toEqual([0, 2000, 4000]);
  expect(result.shots.at(-1)?.endMs).toBe(result.info.durationMs);
}, 60_000);
