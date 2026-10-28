import { expect, test } from "vitest";
import sampleContentJson from "../../../../fixtures/content.sample.json" with {
  type: "json",
};
import footagePlanJson from "../../../../fixtures/plan.footage.json" with {
  type: "json",
};
import textPlanJson from "../../../../fixtures/plan.text.json" with {
  type: "json",
};
import { ContentMapSchema } from "../../../video/schema/content";
import { PlanSchema } from "../../../video/schema/plan";
import { buildVideo, pickMusic } from "./buildVideo";

const sampleContent = ContentMapSchema.parse(sampleContentJson);
const footagePlan = PlanSchema.parse(footagePlanJson);
const textPlan = PlanSchema.parse(textPlanJson);
const brand = { colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"], font: "Onest" };

test("buildVideo from the footage plan is a valid document", () => {
  const doc = buildVideo(
    footagePlan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  expect(doc.durationMs).toBe(45000);
  expect(doc.scenes.map((s) => s.id)).toEqual(
    footagePlan.beats.map((b) => b.id),
  );
  expect(doc.captions?.pages.length).toBeGreaterThan(0);
  expect(doc.scenes[0]?.footage?.assetId).toBe("source");
  expect(doc.scenes[0]?.elements[0]?.id).toBe(
    `${footagePlan.beats[0]?.id}-${footagePlan.beats[0]?.overlays[0]?.id}`,
  );
});

test("buildVideo without speech has no captions and does not throw", () => {
  const silent = {
    ...sampleContent,
    transcript: { language: "en", text: "", words: [] },
  };
  const doc = buildVideo(
    footagePlan,
    silent,
    { sourceVideo: { path: "in.mp4", info: silent.source } },
    brand,
  );
  expect(doc.captions).toBeUndefined();
  expect(doc.music).toBeUndefined();
});

test("buildVideo stretches a scene to fit its voice and keeps the total", () => {
  const voice = [
    {
      beatId: "b1",
      path: "voice/b1.mp3",
      durationMs: 4000,
      words: [
        { text: "Reports", startMs: 100, endMs: 600 },
        { text: "now", startMs: 700, endMs: 900 },
      ],
    },
  ];
  const doc = buildVideo(textPlan, null, { voice }, brand);
  expect(doc.durationMs).toBe(15000);
  expect(doc.scenes.reduce((sum, s) => sum + s.durationMs, 0)).toBe(15000);
  expect(
    doc.scenes.find((s) => s.id === "b1")?.durationMs,
  ).toBeGreaterThanOrEqual(4300);
  expect(doc.voice[0]).toEqual({ assetId: "voice-b1", atMs: 0 });
  expect(doc.captions?.pages[0]?.tokens[0]?.fromMs).toBe(100);
});

test("pickMusic matches a track by mood and returns nothing for an empty manifest", () => {
  const manifest = {
    tracks: [
      {
        file: "calm.mp3",
        title: "Calm",
        mood: "calm",
        bpm: 80,
        license: "CC0",
        source: "x",
        durationMs: 90000,
      },
    ],
  };
  expect(pickMusic(manifest, "calm")?.path).toContain("calm.mp3");
  expect(pickMusic({ tracks: [] }, "calm")).toBeUndefined();
});
