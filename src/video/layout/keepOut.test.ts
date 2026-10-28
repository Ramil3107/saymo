import { expect, test } from "vitest";
import { fitCover } from "./fitCover";
import { keepOutZones, mapBoxThroughTransform, overlapRatio } from "./keepOut";

const source = { width: 1920, height: 1080 };
const target = { width: 1080, height: 1920 };

test("mapBoxThroughTransform moves a source face box into frame space", () => {
  const face = { x: 0.08, y: 0.18, w: 0.22, h: 0.42 };
  const transform = fitCover(source, target, { x: 0.19, y: 0.39 });
  const mapped = mapBoxThroughTransform(face, source, transform, target);
  expect(mapped.x).toBeCloseTo(0.152, 2);
  expect(mapped.w).toBeCloseTo(0.695, 2);
  expect(mapped.y).toBeCloseTo(0.18, 2);
  expect(mapped.h).toBeCloseTo(0.42, 2);
});

test("keepOutZones takes only faces inside the overlay window and pads by 0.02", () => {
  const faces = [
    { tMs: 1000, x: 0.1, y: 0.2, w: 0.1, h: 0.2 },
    { tMs: 9000, x: 0.8, y: 0.2, w: 0.1, h: 0.2 },
  ];
  const zones = keepOutZones({
    faces,
    window: { startMs: 0, endMs: 3000 },
    source,
    transform: fitCover(source, target),
    target,
  });
  expect(zones).toHaveLength(1);
  expect(zones[0]?.y).toBeCloseTo(0.18, 6);
});

test("overlapRatio is the overlapped share of the element", () => {
  const element = { x: 0, y: 0, w: 0.4, h: 0.4 };
  expect(overlapRatio(element, [{ x: 0.2, y: 0.2, w: 1, h: 1 }])).toBeCloseTo(
    0.25,
    6,
  );
  expect(overlapRatio(element, [])).toBe(0);
});
