import { expect, test } from "vitest";
import { fitCover } from "../fitCover";

test("fitCover fills 9:16 from 16:9 and keeps the face in frame", () => {
  const t = fitCover({ width: 1920, height: 1080 }, { width: 1080, height: 1920 }, { x: 0.2, y: 0.5 });
  expect(t.scale).toBeCloseTo(1920 / 1080, 4);
  expect(t.x).toBeLessThanOrEqual(0);
  expect(t.x).toBeGreaterThanOrEqual(1080 - 1920 * t.scale);
});

test("fitCover centers when there is no focus", () => {
  const t = fitCover({ width: 1920, height: 1080 }, { width: 1080, height: 1920 });
  expect(t.x).toBeCloseTo((1080 - 1920 * t.scale) / 2, 3);
  expect(t.y).toBeCloseTo(0, 3);
});
