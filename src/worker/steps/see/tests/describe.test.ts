import type Anthropic from "@anthropic-ai/sdk";
import { expect, test } from "vitest";
import { Metrics } from "../../../../lib/metrics";
import { batch, describeKeyframes, estimateVisionUsd, selectFramesForDescription } from "../describe";

test("batch splits 300 frames into 15 calls", () => {
  expect(batch(Array(300).fill(0), 20)).toHaveLength(15);
});

test("selectFramesForDescription keeps one frame per shot and caps at 60", () => {
  const frames = Array.from({ length: 300 }, (_, i) => ({
    tMs: i * 2000,
    path: `${i}.jpg`,
  }));
  const shots = [
    { index: 0, startMs: 0, endMs: 7000 },
    { index: 1, startMs: 7000, endMs: 600000 },
  ];
  const picked = selectFramesForDescription(frames, shots);
  expect(picked).toHaveLength(60);
  expect(picked.map((f) => f.tMs)).toContain(6000);
  expect(picked.map((f) => f.tMs)).toEqual([...picked.map((f) => f.tMs)].sort((a, b) => a - b));
});

test("estimateVisionUsd for 300 frames on opus 5.5", () => {
  expect(estimateVisionUsd(300, "claude-opus-5-5")).toBeCloseTo((300 * (1600 * 4 + 200 * 20)) / 1e6, 6);
});

test("describeKeyframes refuses to start above budget", async () => {
  await expect(
    describeKeyframes({
      client: {} as Anthropic,
      model: "claude-opus-5-5",
      frames: Array(300).fill({ tMs: 0, path: "x" }),
      budgetUsd: 0.5,
      metrics: new Metrics(),
    }),
  ).rejects.toThrow("Vision budget exceeded");
});
