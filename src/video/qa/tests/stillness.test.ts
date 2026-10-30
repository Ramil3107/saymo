import { expect, test } from "vitest";
import { frameChanges, isStill } from "../stillness";

const output = [
  "frame:0    pts:1      pts_time:0.0333",
  "lavfi.signalstats.YMAX=6",
  "frame:1    pts:2      pts_time:0.0666",
  "lavfi.signalstats.YMAX=254",
].join("\n");

test("frameChanges reads every YMAX line", () => {
  expect(frameChanges(output)).toEqual([6, 254]);
});

test("a stretch is still when every change stays within compression noise", () => {
  expect(isStill([2, 6, 9])).toBe(true);
  expect(isStill([2, 194, 9])).toBe(false);
});
