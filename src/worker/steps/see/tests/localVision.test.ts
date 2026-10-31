import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { WaitingError } from "../../local";
import { describeLocally } from "../localVision";

const frames = [
  { tMs: 0, path: "runs/x/frames/0000.jpg" },
  { tMs: 2000, path: "runs/x/frames/0001.jpg" },
];

test("describeLocally lists the frames to describe, then reads the notes written for them", async () => {
  const folder = join(mkdtempSync(join(tmpdir(), "saymo-vision-")), "vision");

  await expect(describeLocally(frames, folder)).rejects.toBeInstanceOf(WaitingError);
  expect(readFileSync(join(folder, "frames.md"), "utf8")).toContain("2000 ms: runs/x/frames/0001.jpg");

  const note = { tMs: 0, description: "A woman talks to camera", kind: "face", onScreenText: [] };
  writeFileSync(join(folder, "frames.json"), JSON.stringify({ frames: [note, { ...note, tMs: 2000 }] }));
  expect((await describeLocally(frames, folder)).map((frame) => frame.tMs)).toEqual([0, 2000]);
});
