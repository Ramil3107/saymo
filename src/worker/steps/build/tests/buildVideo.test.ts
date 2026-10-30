import { expect, test } from "vitest";
import sampleContentJson from "../../../../../fixtures/content.sample.json" with { type: "json" };
import footagePlanJson from "../../../../../fixtures/plan.footage.json" with { type: "json" };
import textPlanJson from "../../../../../fixtures/plan.text.json" with { type: "json" };
import { destinations } from "../../../../video/destinations";
import { intersectionArea } from "../../../../video/layout/geometry";
import { captionBand } from "../../../../video/layout/safeZones";
import { ContentMapSchema } from "../../../../video/schema/content";
import { PlanSchema } from "../../../../video/schema/plan";
import { buildVideo, pickMusic } from "../buildVideo";

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
  expect(doc.scenes.map((s) => s.id)).toEqual(footagePlan.beats.map((b) => b.id));
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
  expect(doc.scenes.find((s) => s.id === "b1")?.durationMs).toBeGreaterThanOrEqual(4300);
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

test("buildVideo keeps overlays out of the caption band when captions are enabled", () => {
  const doc = buildVideo(
    footagePlan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  const band = captionBand(destinations.reels.safeZone);
  for (const element of doc.scenes.flatMap((s) => s.elements)) {
    const below = element.box.y >= band.y + band.h;
    const above = element.box.y + element.box.h <= band.y;
    expect(below || above).toBe(true);
  }
});

test("buildVideo grows the document when every beat is voiced and speech outruns the plan", () => {
  const voice = [
    { beatId: "b1", path: "voice/b1.mp3", durationMs: 2000, words: [] },
    { beatId: "b2", path: "voice/b2.mp3", durationMs: 9000, words: [] },
    { beatId: "b3", path: "voice/b3.mp3", durationMs: 4000, words: [] },
  ];
  const doc = buildVideo(textPlan, null, { voice }, brand);
  expect(doc.durationMs).toBe(2300 + 9300 + 4300);
  expect(doc.scenes.map((s) => s.durationMs)).toEqual([2300, 9300, 4300]);
});

test("buildVideo keeps caption pages inside their scene", () => {
  const doc = buildVideo(
    footagePlan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  for (const page of doc.captions?.pages ?? []) {
    const scene = doc.scenes.find(
      (s) => page.startMs >= s.startMs && page.startMs < s.startMs + s.durationMs,
    );
    expect(scene).toBeDefined();
    expect(page.startMs + page.durationMs).toBeLessThanOrEqual(
      (scene?.startMs ?? 0) + (scene?.durationMs ?? 0),
    );
  }
});

test("a talking-head footage document passes QA with the keep-out zones the run computes", async () => {
  const { runQa } = await import("../../../../video/qa/checks");
  const { keepOutForScenes } = await import("../buildVideo");
  const doc = buildVideo(
    footagePlan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  const report = runQa(
    doc,
    footagePlan,
    keepOutForScenes(doc, footagePlan, sampleContent),
    sampleContent.source.durationMs,
  );
  expect(report.issues.filter((i) => i.severity === "error")).toEqual([]);
  expect(report.ok).toBe(true);
});

test("buildVideo keeps an unvoiced beat at its planned length when voiced beats alone outrun the plan", () => {
  const voice = [
    { beatId: "b1", path: "voice/b1.mp3", durationMs: 8000, words: [] },
    { beatId: "b2", path: "voice/b2.mp3", durationMs: 9000, words: [] },
  ];
  const doc = buildVideo(textPlan, null, { voice }, brand);
  expect(doc.scenes.map((s) => s.durationMs)).toEqual([8300, 9300, 4000]);
  expect(doc.durationMs).toBe(8300 + 9300 + 4000);
});

test("buildVideo keeps elements that share time in a scene apart", () => {
  const first = textPlan.beats[0];
  if (!first) throw new Error("fixture has no beats");
  const overlays = [
    { id: "h", kind: "headline" as const, text: "Ends Sunday midnight", atMs: 0, durationMs: 2000 },
    { id: "s", kind: "sticker" as const, text: "Hurry", atMs: 0, durationMs: 2000 },
  ];
  const plan = { ...textPlan, beats: [{ ...first, overlays }, ...textPlan.beats.slice(1)] };

  const [headline, sticker] = buildVideo(plan, null, {}, brand).scenes[0]?.elements ?? [];
  if (!headline || !sticker) throw new Error("scene has no elements");

  expect(intersectionArea(headline.box, sticker.box)).toBe(0);
});

test("buildVideo drops an overlay that would cover a face seen anywhere in its beat", () => {
  const beat = footagePlan.beats[0];
  const overlay = beat?.overlays[0];
  if (!beat?.footage || !overlay) throw new Error("fixture beat has no footage or overlays");
  const faceEverywhere = { x: 0, y: 0, w: 1, h: 1, tMs: beat.footage.fromMs + 100 };
  const content = { ...sampleContent, faces: [faceEverywhere] };
  const plan = {
    ...footagePlan,
    beats: [{ ...beat, overlays: beat.overlays.slice(0, 1) }, ...footagePlan.beats.slice(1)],
  };

  const doc = buildVideo(plan, content, { sourceVideo: { path: "in.mp4", info: content.source } }, brand);

  expect(doc.scenes[0]?.elements).toEqual([]);
});
