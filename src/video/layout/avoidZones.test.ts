import { expect, test } from "vitest";
import { avoidZones } from "./avoidZones";

test("avoidZones merges overlapping boxes inside the interval", () => {
  const faces = [
    { tMs: 1000, x: 0.3, y: 0.2, w: 0.2, h: 0.3 },
    { tMs: 3000, x: 0.35, y: 0.25, w: 0.2, h: 0.3 },
    { tMs: 9000, x: 0.8, y: 0.1, w: 0.1, h: 0.1 },
  ];
  const zones = avoidZones(faces, { startMs: 0, endMs: 5000 }, 0);
  expect(zones).toEqual([{ x: 0.3, y: 0.2, w: 0.25, h: 0.35 }]);
});

test("avoidZones pads boxes and keeps them inside the frame", () => {
  const zones = avoidZones(
    [{ tMs: 0, x: 0, y: 0.9, w: 0.1, h: 0.1 }],
    { startMs: 0, endMs: 1000 },
    0.05,
  );
  expect(zones[0]?.x).toBe(0);
  expect(zones[0]?.y).toBeCloseTo(0.85, 6);
  expect((zones[0]?.y ?? 0) + (zones[0]?.h ?? 0)).toBeCloseTo(1, 6);
});
