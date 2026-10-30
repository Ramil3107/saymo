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

test("fitCover can zoom in and move the focus below a top panel", () => {
  const source = { width: 464, height: 848 };
  const target = { width: 1080, height: 1920 };
  const focus = { x: 0.5, y: 0.25 };
  const plain = fitCover(source, target, focus);
  const shifted = fitCover(source, target, focus, {
    anchor: { x: 0.5, y: 0.72 },
    zoom: 1.3,
    free: { top: 0.42 },
  });

  expect(shifted.scale).toBeCloseTo(plain.scale * 1.3, 6);
  expect((focus.y * source.height * shifted.scale + shifted.y) / target.height).toBeCloseTo(0.72, 2);
  expect(shifted.y + source.height * shifted.scale).toBeGreaterThanOrEqual(target.height);
});

test("fitCover keeps the footage covering the frame beside a side panel", () => {
  const source = { width: 1920, height: 1080 };
  const target = { width: 1080, height: 1920 };
  const shifted = fitCover(
    source,
    target,
    { x: 0.3, y: 0.5 },
    { anchor: { x: 0.75, y: 0.5 }, free: { left: 0.45 } },
  );

  expect(shifted.x).toBeLessThanOrEqual(0.45 * target.width + 1e-6);
  expect(shifted.x + source.width * shifted.scale).toBeGreaterThanOrEqual(target.width - 1e-6);
});
