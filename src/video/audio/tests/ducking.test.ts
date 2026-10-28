import { expect, test } from "vitest";
import { musicVolumeAt, speechIntervals } from "../ducking";

test("speechIntervals merges words closer than the gap", () => {
  const words = [
    { text: "a", startMs: 1000, endMs: 1200 },
    { text: "b", startMs: 1400, endMs: 1800 },
    { text: "c", startMs: 3000, endMs: 3300 },
  ];
  expect(speechIntervals(words)).toEqual([
    { startMs: 1000, endMs: 1800 },
    { startMs: 3000, endMs: 3300 },
  ]);
});

test("musicVolumeAt ducks during speech and ramps", () => {
  const speech = [{ startMs: 1000, endMs: 3000 }];
  expect(musicVolumeAt(0, speech)).toBe(0.9);
  expect(musicVolumeAt(2000, speech)).toBe(0.25);
  expect(musicVolumeAt(900, speech)).toBeGreaterThan(0.25);
  expect(musicVolumeAt(900, speech)).toBeLessThan(0.9);
});
