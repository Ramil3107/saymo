import { expect, test } from "vitest";
import { frameToMs, msToFrame, sceneFrames } from "./frames";

test("msToFrame rounds to the nearest frame at 30 fps", () => {
  expect(msToFrame(1000)).toBe(30);
  expect(msToFrame(1016)).toBe(30);
  expect(msToFrame(1017)).toBe(31);
});

test("frameToMs is the inverse on whole frames", () => {
  expect(frameToMs(45)).toBe(1500);
});

test("sceneFrames keeps consecutive scenes gapless after rounding", () => {
  const a = sceneFrames({ startMs: 0, durationMs: 1016 });
  const b = sceneFrames({ startMs: 1016, durationMs: 1016 });
  expect(a.from + a.durationInFrames).toBe(b.from);
  expect(a.durationInFrames + b.durationInFrames).toBe(msToFrame(2032));
});
