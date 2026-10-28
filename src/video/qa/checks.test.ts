import { expect, test } from "vitest";
import footagePlanJson from "../../../fixtures/plan.footage.json" with {
  type: "json",
};
import textPlanJson from "../../../fixtures/plan.text.json" with {
  type: "json",
};
import sampleDocJson from "../../../fixtures/video.sample.json" with {
  type: "json",
};
import { PlanSchema } from "../schema/plan";
import { type VideoDoc, VideoDocSchema } from "../schema/video";
import { planWithinLimits, runQa } from "./checks";

const footagePlan = PlanSchema.parse(footagePlanJson);
const textPlan = PlanSchema.parse(textPlanJson);
const sampleDoc = VideoDocSchema.parse(sampleDocJson);

test("planWithinLimits flags a plan longer than the destination cap", () => {
  const beat = footagePlan.beats[0];
  if (!beat) throw new Error("fixture has no beats");
  const plan = {
    ...footagePlan,
    lengthMs: 200000,
    beats: [{ ...beat, durationMs: 200000 }],
  };
  expect(planWithinLimits(plan, 600000).map((i) => i.code)).toContain(
    "plan-over-cap",
  );
});

test("planWithinLimits flags a plan longer than the source", () => {
  expect(planWithinLimits(footagePlan, 30000).map((i) => i.code)).toContain(
    "plan-over-source",
  );
  expect(planWithinLimits(footagePlan, null)).toEqual([]);
});

test("runQa passes the fixture document", () => {
  const report = runQa(sampleDoc, textPlan, {}, null);
  expect(report.issues.filter((i) => i.severity === "error")).toEqual([]);
  expect(report.ok).toBe(true);
});

test("runQa flags an element inside an avoid zone", () => {
  const scene = sampleDoc.scenes[0];
  const element = scene?.elements[0];
  if (!scene || !element) throw new Error("fixture has no elements");
  const report = runQa(
    sampleDoc,
    textPlan,
    { [scene.id]: [element.box] },
    null,
  );
  expect(report.issues.map((i) => i.code)).toContain("avoid-zone");
  expect(report.ok).toBe(false);
});

test("runQa flags seven words on screen", () => {
  const scene = sampleDoc.scenes[0];
  const element = scene?.elements[0];
  if (!scene || !element || element.kind !== "headline")
    throw new Error("fixture mismatch");
  const wordy: VideoDoc = {
    ...sampleDoc,
    scenes: [
      {
        ...scene,
        elements: [{ ...element, text: "one two three four five six seven" }],
      },
      ...sampleDoc.scenes.slice(1),
    ],
  };
  expect(runQa(wordy, textPlan, {}, null).issues.map((i) => i.code)).toContain(
    "words-on-screen",
  );
});

test("runQa flags a scene sum that misses the duration and a voice longer than its scene", () => {
  const scene = sampleDoc.scenes[0];
  if (!scene) throw new Error("fixture has no scenes");
  const broken: VideoDoc = {
    ...sampleDoc,
    durationMs: 16000,
    assets: [{ id: "voice-b1", kind: "audio", src: "v.mp3", durationMs: 5000 }],
    voice: [{ assetId: "voice-b1", atMs: 0 }],
  };
  const codes = runQa(broken, textPlan, {}, null).issues.map((i) => i.code);
  expect(codes).toContain("scenes-sum");
  expect(codes).toContain("voice-overflow");
});
