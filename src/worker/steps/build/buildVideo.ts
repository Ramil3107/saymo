import { join } from "node:path";
import { z } from "zod";
import { speechIntervals } from "../../../video/audio/ducking";
import { pagesFor } from "../../../video/captions/looks";
import { stepAside, type Window } from "../../../video/captions/stepAside";
import { rebaseWords } from "../../../video/captions/timeline";
import { type Destination, destinations, formatSize } from "../../../video/destinations";
import { chipSize } from "../../../video/layout/chipSize";
import { fitContain, fitCover } from "../../../video/layout/fitCover";
import { intersectionArea } from "../../../video/layout/geometry";
import { keepOutErrorShare, keepOutZones, overlapRatio } from "../../../video/layout/keepOut";
import {
  cardArea,
  coverOptionsFor,
  type Fit,
  isPanelKind,
  type Layout,
  panelBox,
  panelSide,
  type Side,
} from "../../../video/layout/layouts";
import { captionBand, placeOverlay } from "../../../video/layout/safeZones";
import type { Box, ContentMap } from "../../../video/schema/content";
import type { MediaInfo } from "../../../video/schema/media";
import type { Beat, Overlay, Plan } from "../../../video/schema/plan";
import { TranscriptSchema, type TranscriptWord } from "../../../video/schema/transcript";
import {
  type CaptionPage,
  type Element,
  type Scene,
  type VideoDoc,
  VideoDocSchema,
} from "../../../video/schema/video";
import { defaultStyle } from "../../../video/styles";
import type { TitleLine } from "../../../video/type/schedule";

export const SpokenBeatSchema = z.object({
  beatId: z.string(),
  path: z.string(),
  durationMs: z.number(),
  words: TranscriptSchema.shape.words,
});

export type SpokenBeat = z.infer<typeof SpokenBeatSchema>;

export const MusicManifestSchema = z.object({
  tracks: z.array(
    z.object({
      file: z.string(),
      title: z.string(),
      mood: z.string(),
      bpm: z.number(),
      license: z.string(),
      source: z.string(),
      durationMs: z.number(),
    }),
  ),
});

export type MusicManifest = z.infer<typeof MusicManifestSchema>;

export type BuildAssets = {
  sourceVideo?: { path: string; info: MediaInfo };
  music?: { path: string; durationMs: number };
  voice?: SpokenBeat[];
};

type Size = { width: number; height: number };
type Point = { x: number; y: number };
type Transform = { scale: number; x: number; y: number };
type Interval = { startMs: number; endMs: number };
type Slot = { beat: Beat; startMs: number; durationMs: number };
type Framing = { layout: Layout; side: Side; fit: Fit };
type Timing = { enterMs: number; exitMs: number };

type SceneContext = {
  destination: Destination;
  content: ContentMap | null;
  source: Size | undefined;
  target: Size;
  captionsOn: boolean;
  captionStyle: Plan["captions"]["style"];
  spoken: SpokenBeat | undefined;
};

type BuiltScene = {
  scene: Scene;
  words: TranscriptWord[];
  pages: CaptionPage[];
  voice: VideoDoc["voice"][number] | undefined;
};

type FaceZoneInput = {
  content: ContentMap | null;
  source: Size | undefined;
  transform: Transform | undefined;
  target: Size;
  window: Interval;
};

const voicePaddingMs = 300;
const sourceAssetId = "source";
const musicAssetId = "music";
const musicVolume = 0.9;
const musicDuckTo = 0.25;

export function buildVideo(
  plan: Plan,
  content: ContentMap | null,
  assets: BuildAssets,
  brand: VideoDoc["brand"],
): VideoDoc {
  const destination = destinations[plan.destination];
  const target = formatSize(destination.format);
  const source = assets.sourceVideo ? sizeOf(assets.sourceVideo.info) : undefined;
  const spokenByBeat = new Map((assets.voice ?? []).map((spoken) => [spoken.beatId, spoken]));

  const slots = timeline(plan, assets.voice);
  const built = slots.map((slot) =>
    buildScene(slot, {
      destination,
      content,
      source,
      target,
      captionsOn: plan.captions.enabled,
      captionStyle: plan.captions.style,
      spoken: spokenByBeat.get(slot.beat.id),
    }),
  );

  const words = built.flatMap((scene) => scene.words);
  const pages = built.flatMap((scene) => scene.pages);
  const captions =
    plan.captions.enabled && pages.length > 0
      ? { style: plan.captions.style, keywords: plan.captions.keywords, pages }
      : undefined;
  const music = assets.music
    ? { assetId: musicAssetId, volume: musicVolume, duckTo: musicDuckTo, speech: speechIntervals(words) }
    : undefined;

  return VideoDocSchema.parse({
    id: documentId(plan),
    format: destination.format,
    fps: 30,
    durationMs: slots.reduce((sum, slot) => sum + slot.durationMs, 0),
    destination: plan.destination,
    register: plan.register,
    style: plan.style ?? defaultStyle[plan.register],
    brand,
    assets: documentAssets(assets),
    scenes: built.map((scene) => scene.scene),
    captions,
    music,
    voice: built.flatMap((scene) => (scene.voice ? [scene.voice] : [])),
  });
}

export function keepOutForScenes(
  doc: VideoDoc,
  plan: Plan,
  content: ContentMap | null,
): Record<string, Box[]> {
  const destination = destinations[plan.destination];
  const target = formatSize(destination.format);
  const source = content ? sizeOf(content.source) : undefined;
  const band = doc.captions ? [captionBand(destination.safeZone)] : [];

  const zonesByScene = plan.beats.map((beat) => {
    const scene = doc.scenes.find((candidate) => candidate.id === beat.id);
    const window = beat.footage ? { startMs: beat.footage.fromMs, endMs: beat.footage.toMs } : undefined;
    const zones = window
      ? faceZones({ content, source, transform: scene?.footage?.transform, target, window })
      : [];

    return [beat.id, [...zones, ...band]];
  });

  return Object.fromEntries(zonesByScene);
}

export function pickMusic(manifest: MusicManifest, mood: string): BuildAssets["music"] {
  const wanted = mood.toLowerCase();
  const track =
    manifest.tracks.find((candidate) => candidate.mood.toLowerCase() === wanted) ?? manifest.tracks[0];
  if (!track) return undefined;

  return { path: join("assets", "music", track.file), durationMs: track.durationMs };
}

function timeline(plan: Plan, voice: BuildAssets["voice"]): Slot[] {
  const durations = sceneDurations(plan, voice);
  let startMs = 0;

  return plan.beats.map((beat, index) => {
    const durationMs = durations[index] ?? beat.durationMs;
    const slot = { beat, startMs, durationMs };
    startMs += durationMs;
    return slot;
  });
}

// Voiced beats only grow; unvoiced beats share the room left in the plan, and when none is left the video grows.
function sceneDurations(plan: Plan, voice: BuildAssets["voice"]): number[] {
  const floors = voiceFloors(plan, voice);
  const planned = plan.beats.map((beat, index) => floors[index] ?? beat.durationMs);
  const flexible = floors.map((floor) => floor === undefined);
  const fixedMs = planned.filter((_, index) => !flexible[index]).reduce(sum, 0);
  const flexibleMs = planned.filter((_, index) => flexible[index]).reduce(sum, 0);
  const roomMs = plan.lengthMs - fixedMs;
  const lastFlexible = flexible.lastIndexOf(true);

  if (lastFlexible < 0) return roomMs > 0 ? stretched(planned, planned.length - 1, roomMs) : planned;
  if (roomMs <= 0) return planned;

  const factor = roomMs / flexibleMs;
  const scaled = planned.map((ms, index) => (flexible[index] ? Math.round(ms * factor) : ms));
  const drift = plan.lengthMs - scaled.reduce(sum, 0);

  return stretched(scaled, lastFlexible, drift);
}

function voiceFloors(plan: Plan, voice: BuildAssets["voice"]): (number | undefined)[] {
  const spokenByBeat = new Map((voice ?? []).map((spoken) => [spoken.beatId, spoken]));

  return plan.beats.map((beat) => {
    const spoken = spokenByBeat.get(beat.id);
    return spoken ? Math.max(beat.durationMs, spoken.durationMs + voicePaddingMs) : undefined;
  });
}

function stretched(durations: number[], index: number, byMs: number): number[] {
  return durations.map((ms, i) => (i === index ? ms + byMs : ms));
}

function buildScene(slot: Slot, context: SceneContext): BuiltScene {
  const { beat, startMs, durationMs } = slot;
  const framing = framingFor(beat, context);
  const transform = footageTransform(beat, context, framing);
  const elements = placeElements(slot, transform, context, framing);
  const words = sceneWords(slot, context);

  const scene: Scene = {
    id: beat.id,
    startMs,
    durationMs,
    background: beat.footage ? { kind: "brand" } : { kind: "style" },
    footage:
      beat.footage && transform
        ? { assetId: sourceAssetId, fromMs: beat.footage.fromMs, fit: framing.fit, transform }
        : undefined,
    camera: beat.camera,
    elements,
    transition: beat.transition ?? "cut",
  };

  return {
    scene,
    words,
    pages:
      words.length > 0
        ? stepAside(pagesWithin(words, slot, context.captionStyle), titleWindows(elements, startMs))
        : [],
    voice: context.spoken ? { assetId: voiceAssetId(beat.id), atMs: startMs } : undefined,
  };
}

function framingFor(beat: Beat, context: SceneContext): Framing {
  const fit = fitFor(beat, context.content);
  const hasPanel = beat.overlays.some((overlay) => isPanelKind(overlay.kind));
  const hasTitle = fit === "card" && beat.overlays.some((overlay) => overlay.kind === "headline");
  const layout = beat.layout ?? (hasPanel || hasTitle ? "panel-top" : "free");
  const focus = beat.footage ? faceFocus(context.content, beat.footage) : undefined;

  return { layout, side: panelSide(focus), fit };
}

// A shot whose frames are mostly a screen or a document is shown inside a card, not stretched over the frame.
function fitFor(beat: Beat, content: ContentMap | null): Fit {
  if (!beat.footage || !content) return "cover";
  const { fromMs, toMs } = beat.footage;
  const notes = content.frames.filter((frame) => frame.tMs >= fromMs && frame.tMs <= toMs);
  const screens = notes.filter((frame) => frame.kind === "screen").length;

  return notes.length > 0 && screens * 2 >= notes.length ? "card" : "cover";
}

function footageTransform(beat: Beat, context: SceneContext, framing: Framing): Transform | undefined {
  if (!beat.footage || !context.source) return undefined;

  if (framing.fit === "card") {
    const area = cardArea(framing.layout, framing.side, context.destination.safeZone, context.captionsOn);
    return fitContain(context.source, context.target, area);
  }

  const focus = faceFocus(context.content, beat.footage);
  return fitCover(context.source, context.target, focus, coverOptionsFor(framing.layout, framing.side));
}

function faceFocus(content: ContentMap | null, range: { fromMs: number; toMs: number }): Point | undefined {
  const faces = content?.faces.filter((face) => face.tMs >= range.fromMs && face.tMs <= range.toMs) ?? [];
  if (faces.length === 0) return undefined;

  const centers = faces.map((face) => ({ x: face.x + face.w / 2, y: face.y + face.h / 2 }));

  return { x: average(centers.map((center) => center.x)), y: average(centers.map((center) => center.y)) };
}

function placeElements(
  slot: Slot,
  transform: Transform | undefined,
  context: SceneContext,
  framing: Framing,
): Element[] {
  const placed: Element[] = [];
  const { beat, durationMs } = slot;
  const panel = framing.layout === "free" ? undefined : panelBox(framing.layout, framing.side, framing.fit);
  const card =
    framing.fit === "card"
      ? cardArea(framing.layout, framing.side, context.destination.safeZone, context.captionsOn)
      : undefined;
  const reserved = [panel, card].filter((box): box is Box => box !== undefined);

  for (const overlay of beat.overlays) {
    if (panel && fillsPanel(overlay, framing)) {
      placed.push(elementFrom(beat, asPanelOverlay(overlay), panel, durationMs));
      continue;
    }
    const timing = elementTiming(overlay, durationMs);
    const taken = placed.filter((element) => sharesTime(element, timing)).map((element) => element.box);
    const element = placeElement(overlay, slot, transform, context, [...reserved, ...taken]);
    if (element) placed.push(element);
  }

  return placed;
}

function fillsPanel(overlay: Overlay, framing: Framing): boolean {
  return isPanelKind(overlay.kind) || (framing.fit === "card" && overlay.kind === "headline");
}

// A headline over a document becomes the title strip above the card.
function asPanelOverlay(overlay: Overlay): Overlay {
  return overlay.kind === "headline" ? { ...overlay, kind: "title-card" } : overlay;
}

function placeElement(
  overlay: Overlay,
  slot: Slot,
  transform: Transform | undefined,
  context: SceneContext,
  taken: Box[],
): Element | undefined {
  const { beat, durationMs } = slot;
  const { destination } = context;

  const zones = faceZones({
    content: context.content,
    source: context.source,
    transform,
    target: context.target,
    window: beatWindow(beat),
  });
  const band = context.captionsOn ? [captionBand(destination.safeZone)] : [];
  const measured =
    overlay.kind === "chip" ? chipSize(overlay.text, overlay.badge, destination.format) : undefined;
  const box = placeOverlay(
    overlay.kind,
    destination.format,
    destination.safeZone,
    [...zones, ...band, ...taken],
    measured,
  );
  if (overlapRatio(box, zones) > keepOutErrorShare) return undefined;
  if (taken.some((other) => intersectionArea(box, other) > 0)) return undefined;

  return elementFrom(beat, overlay, box, durationMs);
}

function elementTiming(overlay: Overlay, sceneDurationMs: number): Timing {
  return {
    enterMs: Math.min(overlay.atMs, Math.max(0, sceneDurationMs - 1)),
    exitMs: Math.min(overlay.atMs + overlay.durationMs, sceneDurationMs),
  };
}

function sharesTime(a: Timing, b: Timing): boolean {
  return a.enterMs < b.exitMs && b.enterMs < a.exitMs;
}

// Keyframes are two seconds apart, so faces are looked up over the whole beat, as QA does.
function beatWindow(beat: Beat): Interval {
  if (!beat.footage) return { startMs: 0, endMs: 0 };
  return { startMs: beat.footage.fromMs, endMs: beat.footage.toMs };
}

function faceZones(input: FaceZoneInput): Box[] {
  if (!input.content || !input.source || !input.transform) return [];

  return keepOutZones({
    faces: input.content.faces,
    window: input.window,
    source: input.source,
    transform: input.transform,
    target: input.target,
  });
}

function elementFrom(beat: Beat, overlay: Overlay, box: Box, sceneDurationMs: number): Element {
  const base = {
    id: `${beat.id}-${overlay.id}`,
    ...elementTiming(overlay, sceneDurationMs),
    box,
    emphasis: overlay.emphasis,
  };

  switch (overlay.kind) {
    case "headline":
      return { ...base, kind: "headline", text: overlay.text, sub: overlay.sub };
    case "chip":
      return { ...base, kind: "chip", text: overlay.text, badge: overlay.badge };
    case "big-number":
      return { ...base, kind: "big-number", value: overlay.text, label: overlay.sub };
    case "lower-third":
      return { ...base, kind: "lower-third", name: overlay.text, role: overlay.sub };
    case "quote":
      return { ...base, kind: "quote", text: overlay.text, author: overlay.sub };
    case "sticker":
      return { ...base, kind: "sticker", text: overlay.text };
    case "title-card":
      return { ...base, kind: "title-card", text: overlay.text, sub: overlay.sub };
    case "list":
      return { ...base, kind: "list", text: overlay.text, items: overlay.items ?? [] };
    case "title":
      return { ...base, kind: "title", lines: titleLines(overlay), entrance: overlay.entrance ?? "rise" };
    case "counter":
      return {
        ...base,
        kind: "counter",
        value: counterValue(overlay),
        prefix: overlay.prefix,
        suffix: overlay.suffix,
        label: overlay.sub,
      };
    case "corner-label":
      return { ...base, kind: "corner-label", text: overlay.text };
  }
}

// A title without lines falls back to its text, with the sub as a smaller accent line.
function titleLines(overlay: Overlay): TitleLine[] {
  if (overlay.lines && overlay.lines.length > 0) return overlay.lines;

  const main: TitleLine = { text: overlay.text, size: "l", tone: "ink", align: "center" };
  return overlay.sub ? [main, { text: overlay.sub, size: "m", tone: "accent", align: "center" }] : [main];
}

function counterValue(overlay: Overlay): number {
  return overlay.value ?? (Number.parseFloat(overlay.text.replace(/[^\d.-]/g, "")) || 0);
}

function sceneWords(slot: Slot, context: SceneContext): TranscriptWord[] {
  const { beat, startMs } = slot;
  const transcript = context.content?.transcript;
  const fromFootage = beat.footage && transcript ? rebaseWords(transcript.words, beat.footage, startMs) : [];
  const fromVoice = context.spoken ? shiftWords(context.spoken.words, startMs) : [];

  return [...fromFootage, ...fromVoice];
}

function shiftWords(words: TranscriptWord[], byMs: number): TranscriptWord[] {
  return words.map((word) => ({ ...word, startMs: word.startMs + byMs, endMs: word.endMs + byMs }));
}

function titleWindows(elements: Element[], sceneStartMs: number): Window[] {
  return elements
    .filter((element) => element.kind === "title")
    .map((element) => ({ startMs: sceneStartMs + element.enterMs, endMs: sceneStartMs + element.exitMs }));
}

function pagesWithin(words: TranscriptWord[], slot: Slot, style: Plan["captions"]["style"]): CaptionPage[] {
  const endMs = slot.startMs + slot.durationMs;
  const pages = pagesFor(style, words);

  return pages.map((page) => ({
    ...page,
    durationMs: Math.min(page.durationMs, Math.max(0, endMs - page.startMs)),
  }));
}

function documentAssets(assets: BuildAssets): VideoDoc["assets"] {
  const list: VideoDoc["assets"] = [];

  if (assets.sourceVideo) {
    const { path, info } = assets.sourceVideo;
    list.push({
      id: sourceAssetId,
      kind: "video",
      src: path,
      durationMs: info.durationMs,
      width: info.width,
      height: info.height,
    });
  }
  if (assets.music) {
    list.push({
      id: musicAssetId,
      kind: "audio",
      src: assets.music.path,
      durationMs: assets.music.durationMs,
    });
  }
  for (const spoken of assets.voice ?? []) {
    list.push({
      id: voiceAssetId(spoken.beatId),
      kind: "audio",
      src: spoken.path,
      durationMs: spoken.durationMs,
    });
  }

  return list;
}

function documentId(plan: Plan): string {
  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${plan.destination}-${slug || "video"}`;
}

function voiceAssetId(beatId: string): string {
  return `voice-${beatId}`;
}

function sizeOf(info: Size): Size {
  return { width: info.width, height: info.height };
}

function average(values: number[]): number {
  return values.reduce(sum, 0) / values.length;
}

function sum(total: number, value: number): number {
  return total + value;
}
