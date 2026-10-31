import { expect, test } from "vitest";
import sampleContentJson from "../../../../../fixtures/content.sample.json" with { type: "json" };
import footagePlanJson from "../../../../../fixtures/plan.footage.json" with { type: "json" };
import textPlanJson from "../../../../../fixtures/plan.text.json" with { type: "json" };
import { destinations } from "../../../../video/destinations";
import { intersectionArea } from "../../../../video/layout/geometry";
import { isKineticKind } from "../../../../video/layout/layouts";
import { captionBand } from "../../../../video/layout/safeZones";
import { ContentMapSchema } from "../../../../video/schema/content";
import { PlanSchema } from "../../../../video/schema/plan";
import { buildVideo, keepOutForScenes, pickMusic } from "../buildVideo";

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
  const [first, ...rest] = textPlanJson.beats;
  if (!first) throw new Error("The text plan has no beats");
  const chip = { id: "o1", kind: "chip", text: "PDF", atMs: 0, durationMs: 2000 };
  const plan = PlanSchema.parse({ ...textPlanJson, beats: [{ ...first, overlays: [chip] }, ...rest] });

  const doc = buildVideo(plan, null, { voice }, brand);
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

test("buildVideo keeps all but kinetic text out of the caption band when captions are enabled", () => {
  const doc = buildVideo(
    footagePlan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  const band = captionBand(destinations.reels.safeZone);
  const elements = doc.scenes.flatMap((s) => s.elements).filter((element) => !isKineticKind(element.kind));
  expect(elements.length).toBeGreaterThan(0);
  for (const element of elements) {
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

test("buildVideo sizes a chip from its text and keeps its badge", () => {
  const first = textPlan.beats[0];
  if (!first) throw new Error("fixture has no beats");
  const overlays = [
    { id: "a", kind: "chip" as const, text: "Fe", badge: "Fe", atMs: 0, durationMs: 1000 },
    { id: "b", kind: "chip" as const, text: "порушення випорожнень", atMs: 1000, durationMs: 1000 },
  ];
  const plan = { ...textPlan, beats: [{ ...first, overlays }, ...textPlan.beats.slice(1)] };

  const [small, wide] = buildVideo(plan, null, {}, brand).scenes[0]?.elements ?? [];
  if (small?.kind !== "chip" || wide?.kind !== "chip") throw new Error("scene has no chips");

  expect(small.badge).toBe("Fe");
  expect(wide.box.w).toBeGreaterThan(small.box.w);
});

test("buildVideo puts a title card in a top panel and moves the face below it", () => {
  const beat = footagePlan.beats[0];
  if (!beat?.footage) throw new Error("fixture beat has no footage");
  const overlays = [
    {
      id: "t",
      kind: "title-card" as const,
      text: "Первинний скринінг",
      sub: "02 · Як перевіритись",
      atMs: 0,
      durationMs: 3000,
    },
  ];
  const plan = {
    ...footagePlan,
    beats: [{ ...beat, layout: "panel-top" as const, overlays }, ...footagePlan.beats.slice(1)],
  };

  const doc = buildVideo(
    plan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  const scene = doc.scenes[0];
  const card = scene?.elements[0];
  if (!scene?.footage || card?.kind !== "title-card") throw new Error("scene has no title card");

  expect(card.box).toEqual({ x: 0, y: 0, w: 1, h: 0.46 });
  expect(scene.footage.transform.y).toBeGreaterThan(0);
});

test("buildVideo puts a list in a side panel away from the face", () => {
  const beat = footagePlan.beats[0];
  if (!beat?.footage) throw new Error("fixture beat has no footage");
  const overlays = [
    {
      id: "l",
      kind: "list" as const,
      text: "Класичні симптоми",
      items: ["нудота", "блювота"],
      atMs: 0,
      durationMs: 3000,
    },
  ];
  const plan = {
    ...footagePlan,
    beats: [{ ...beat, layout: "panel-side" as const, overlays }, ...footagePlan.beats.slice(1)],
  };

  const doc = buildVideo(
    plan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  const list = doc.scenes[0]?.elements[0];
  if (list?.kind !== "list") throw new Error("scene has no list");

  expect(list.items).toEqual(["нудота", "блювота"]);
  expect(list.box.x).toBeGreaterThan(0.5);
});

test("buildVideo shows a screen shot in a card and a face shot as cover", () => {
  const beat = footagePlan.beats[0];
  const footage = beat?.footage;
  if (!footage) throw new Error("fixture beat has no footage");
  const screenNotes = [1, 2, 3].map((n) => ({
    tMs: footage.fromMs + n * 500,
    description: "a lab sheet",
    kind: "screen" as const,
    onScreenText: [],
  }));
  const content = { ...sampleContent, frames: [...screenNotes, ...sampleContent.frames], faces: [] };

  const doc = buildVideo(
    footagePlan,
    content,
    { sourceVideo: { path: "in.mp4", info: content.source } },
    brand,
  );

  expect(doc.scenes[0]?.footage?.fit).toBe("card");
  expect(doc.scenes[1]?.footage?.fit).toBe("cover");
});

test("buildVideo turns a headline over a document card into a title strip above the card", () => {
  const beat = footagePlan.beats[0];
  const footage = beat?.footage;
  if (!beat || !footage) throw new Error("fixture beat has no footage");
  const screenNotes = [1, 2, 3].map((n) => ({
    tMs: footage.fromMs + n * 500,
    description: "a lab sheet",
    kind: "screen" as const,
    onScreenText: [],
  }));
  const content = { ...sampleContent, frames: [...screenNotes, ...sampleContent.frames], faces: [] };
  const overlays = [
    { id: "h", kind: "headline" as const, text: "Стандарти лабораторії", atMs: 0, durationMs: 3000 },
  ];
  const plan = { ...footagePlan, beats: [{ ...beat, overlays }, ...footagePlan.beats.slice(1)] };

  const scene = buildVideo(plan, content, { sourceVideo: { path: "in.mp4", info: content.source } }, brand)
    .scenes[0];
  const title = scene?.elements[0];
  if (!scene?.footage || !title) throw new Error("scene has no elements");

  expect(title.kind).toBe("title-card");
  expect(title.box.h).toBe(0.26);
  expect(scene.footage.transform.y).toBeGreaterThanOrEqual(0.26 * 1920);
});

test("buildVideo leaves out an overlay that could only sit on another element", () => {
  const first = textPlan.beats[0];
  if (!first) throw new Error("fixture has no beats");
  const wide = (id: string) => ({
    id,
    kind: "headline" as const,
    text: "A headline that takes the whole slot",
    atMs: 0,
    durationMs: 2000,
  });
  const plan = {
    ...textPlan,
    beats: [
      { ...first, overlays: [wide("a"), wide("b"), wide("c"), wide("d"), wide("e"), wide("f")] },
      ...textPlan.beats.slice(1),
    ],
  };

  const elements = buildVideo(plan, null, {}, brand).scenes[0]?.elements ?? [];

  for (const one of elements) {
    for (const other of elements) {
      if (one !== other) expect(intersectionArea(one.box, other.box)).toBe(0);
    }
  }
});

test("buildVideo pages keyword-box captions three words at a time", () => {
  const plan = PlanSchema.parse({
    ...footagePlan,
    captions: { ...footagePlan.captions, style: "keyword-box" },
  });
  const doc = buildVideo(
    plan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );
  const pages = doc.captions?.pages ?? [];

  expect(doc.captions?.style).toBe("keyword-box");
  expect(pages.length).toBeGreaterThan(0);
  expect(pages.every((page) => page.tokens.length <= 3)).toBe(true);
});

test("buildVideo picks the style of the register unless the plan names one", () => {
  expect(buildVideo(textPlan, null, {}, brand).style).toBe("bold-pop");

  const calm = PlanSchema.parse({ ...textPlanJson, style: "clean-paper" });
  expect(buildVideo(calm, null, {}, brand).style).toBe("clean-paper");
});

test("buildVideo draws text beats on the style backdrop and keeps each beat's transition", () => {
  const beats = textPlanJson.beats.map((beat, index) =>
    index === 1 ? { ...beat, transition: "whip" } : beat,
  );
  const doc = buildVideo(PlanSchema.parse({ ...textPlanJson, beats }), null, {}, brand);

  expect(doc.scenes.every((scene) => scene.background.kind === "style")).toBe(true);
  expect(doc.scenes.map((scene) => scene.transition)).toEqual(["cut", "whip", "cut"]);
});

test("buildVideo turns title, counter and corner-label overlays into kinetic elements", () => {
  const first = textPlan.beats[0];
  if (!first) throw new Error("The text plan has no beats");
  const overlays = [
    { id: "t", kind: "title", text: "Launch day", sub: "is here", atMs: 0, durationMs: 1500 },
    {
      id: "n",
      kind: "counter",
      text: "40%",
      prefix: "-",
      suffix: "%",
      value: 40,
      atMs: 1500,
      durationMs: 700,
    },
    { id: "c", kind: "corner-label", text: "30 sec", atMs: 0, durationMs: 1500 },
  ];
  const plan = PlanSchema.parse({
    ...textPlanJson,
    beats: [{ ...first, overlays }, ...textPlan.beats.slice(1)],
  });
  const elements = buildVideo(plan, null, {}, brand).scenes[0]?.elements ?? [];

  expect(elements.map((element) => element.kind)).toEqual(["title", "counter", "corner-label"]);
  const title = elements[0];
  expect(title?.kind === "title" ? title.lines.map((line) => line.text) : []).toEqual([
    "Launch day",
    "is here",
  ]);
  const counter = elements[1];
  expect(counter?.kind === "counter" ? counter.value : undefined).toBe(40);
});

test("buildVideo starts no caption page while a title is on screen", () => {
  const first = footagePlanJson.beats[0];
  if (!first) throw new Error("The footage plan has no beats");
  const title = { id: "t", kind: "title", text: "Launch", atMs: 0, durationMs: first.durationMs };
  const plan = PlanSchema.parse({
    ...footagePlanJson,
    beats: [{ ...first, overlays: [title] }, ...footagePlanJson.beats.slice(1)],
  });
  const doc = buildVideo(
    plan,
    sampleContent,
    { sourceVideo: { path: "in.mp4", info: sampleContent.source } },
    brand,
  );

  const titled = doc.scenes[0];
  const inside = (doc.captions?.pages ?? []).filter(
    (page) => titled && page.startMs >= titled.startMs && page.startMs < titled.startMs + titled.durationMs,
  );
  expect(titled?.elements[0]?.kind).toBe("title");
  expect(inside).toEqual([]);
});

test("buildVideo carries an overlay's accent onto its element", () => {
  const doc = buildVideo(textPlan, null, {}, brand);
  const accents = doc.scenes.flatMap((scene) => scene.elements.map((element) => element.accent));

  expect(accents).toContain("stress");
  expect(accents).toContain("celebrate");
});

test("buildVideo sizes chips for the style's display face", () => {
  const chip = { id: "c", kind: "chip", text: "Motion", atMs: 0, durationMs: 2000 };
  const first = textPlanJson.beats[0];
  if (!first) throw new Error("The text plan has no beats");
  const beats = [{ ...first, overlays: [chip] }, ...textPlanJson.beats.slice(1)];
  const widthIn = (style: string) => {
    const doc = buildVideo(PlanSchema.parse({ ...textPlanJson, style, beats }), null, {}, brand);
    return doc.scenes[0]?.elements[0]?.box.w ?? 0;
  };

  expect(widthIn("bold-pop")).toBeGreaterThan(widthIn("clean-paper"));
});

test("buildVideo hides captions while kinetic text is on screen", () => {
  const voice = [
    {
      beatId: "b1",
      path: "voice/b1.mp3",
      durationMs: 1800,
      words: [{ text: "Reports", startMs: 100, endMs: 600 }],
    },
  ];
  const doc = buildVideo(textPlan, null, { voice }, brand);

  expect(doc.scenes[0]?.elements[0]?.kind).toBe("headline");
  expect(doc.captions?.pages ?? []).toHaveLength(0);
});

test("buildVideo frames and keeps clear of the subject the frame notes point at when there is no face", () => {
  const noFaces = { ...sampleContent, faces: [] };
  const subject = { x: 0.7, y: 0.3, w: 0.2, h: 0.4 };
  const withSubject = { ...noFaces, frames: noFaces.frames.map((frame) => ({ ...frame, subject })) };
  const assets = { sourceVideo: { path: "in.mp4", info: sampleContent.source } };

  const plain = buildVideo(footagePlan, noFaces, assets, brand);
  const framed = buildVideo(footagePlan, withSubject, assets, brand);
  const shiftOf = (doc: typeof plain) => doc.scenes[0]?.footage?.transform.x ?? 0;
  expect(shiftOf(framed)).toBeLessThan(shiftOf(plain));

  const zones = keepOutForScenes(framed, footagePlan, withSubject);
  expect(Object.values(zones).some((boxes) => boxes.length > 0)).toBe(true);
});

test("buildVideo shows a subject too wide for a vertical crop whole, as a card", () => {
  const noFaces = { ...sampleContent, faces: [] };
  const wide = { x: 0.2, y: 0, w: 0.6, h: 1 };
  const withProduct = { ...noFaces, frames: noFaces.frames.map((frame) => ({ ...frame, subject: wide })) };
  const assets = { sourceVideo: { path: "in.mp4", info: sampleContent.source } };

  const fitOf = (content: typeof sampleContent) =>
    buildVideo(footagePlan, content, assets, brand).scenes.find((scene) => scene.id === "b1")?.footage?.fit;
  expect(fitOf(withProduct)).toBe("card");
  expect(fitOf(noFaces)).not.toBe("card");
});
