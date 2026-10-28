import { expect, test } from "vitest";
import { Metrics } from "../../../lib/metrics";
import { boxFromRekognition, detectFaces } from "./faces";

test("boxFromRekognition clamps a partly visible face to the frame", () => {
  expect(
    boxFromRekognition({ Left: -0.1, Top: 0.5, Width: 0.3, Height: 0.7 }),
  ).toEqual({ x: 0, y: 0.5, w: 0.2, h: 0.5 });
});

test("detectFaces records one metrics event for all frames", async () => {
  const metrics = new Metrics();
  const detector = {
    detect: async (frame: { tMs: number }) => [
      { tMs: frame.tMs, x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
    ],
  };
  const faces = await detectFaces(
    detector,
    [
      { tMs: 0, path: "a" },
      { tMs: 2000, path: "b" },
    ],
    metrics,
  );
  expect(faces.map((f) => f.tMs)).toEqual([0, 2000]);
  expect(metrics.byStep().see?.usd).toBeCloseTo(0.002, 6);
});
