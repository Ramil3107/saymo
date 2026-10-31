import { type Format, formatSize, type SafeZone } from "../destinations";
import type { Box } from "../schema/content";
import type { OverlayKind } from "../schema/plan";
import { type TitleSize, titleLineHeight, titleSizeShare } from "../type/schedule";
import { boxesOverlap, round6 } from "./geometry";
import { overlapRatio } from "./keepOut";
import { isKineticKind } from "./layouts";

export type Avoid = { soft: Box[]; hard: Box[] };

// With nothing filmed behind it, kinetic text is the picture, so it is set larger.
export const backdropTypeScale = 1.35;

// measured: the label's own size; onBackdrop: no footage, so labels gather in the middle instead of
// keeping to the edges around a subject; titleSizes: a title's lines, so it holds only the height they need.
export type PlaceOptions = { measured?: Size; onBackdrop?: boolean; titleSizes?: TitleSize[] };
export type Inner = { left: number; right: number; top: number; bottom: number };
type Horizontal = "left" | "center" | "right";
type Vertical = "top" | "middle" | "bottom";
type Slot = [Horizontal, Vertical];
type Size = { w: number; h: number };

const slotsByKind: Record<OverlayKind, Slot[]> = {
  headline: [
    ["center", "top"],
    ["center", "bottom"],
    ["center", "middle"],
  ],
  quote: [
    ["center", "middle"],
    ["center", "top"],
    ["center", "bottom"],
  ],
  "big-number": [
    ["center", "middle"],
    ["center", "top"],
    ["center", "bottom"],
  ],
  chip: [
    ["left", "bottom"],
    ["right", "bottom"],
    ["left", "top"],
    ["right", "top"],
  ],
  "lower-third": [
    ["left", "bottom"],
    ["right", "bottom"],
    ["left", "top"],
    ["right", "top"],
  ],
  sticker: [
    ["right", "top"],
    ["left", "top"],
  ],
  "title-card": [["center", "top"]],
  list: [["left", "top"]],
  title: [
    ["center", "middle"],
    ["center", "top"],
    ["center", "bottom"],
  ],
  counter: [
    ["center", "middle"],
    ["center", "top"],
    ["center", "bottom"],
  ],
  "corner-label": [
    ["left", "top"],
    ["right", "top"],
    ["left", "bottom"],
    ["right", "bottom"],
  ],
};

const centeredStack: Slot[] = [
  ["center", "middle"],
  ["center", "top"],
  ["center", "bottom"],
];

const backdropSlots: Partial<Record<OverlayKind, Slot[]>> = {
  chip: centeredStack,
  sticker: centeredStack,
  "lower-third": centeredStack,
};

const widthShare: Record<OverlayKind, number> = {
  headline: 0.84,
  quote: 0.84,
  "big-number": 0.6,
  "lower-third": 0.6,
  chip: 0.36,
  sticker: 0.36,
  "title-card": 1,
  list: 0.46,
  title: 0.88,
  counter: 0.7,
  "corner-label": 0.44,
};

const heightShare: Record<OverlayKind, number> = {
  headline: 0.18,
  quote: 0.12,
  "big-number": 0.12,
  chip: 0.08,
  "lower-third": 0.08,
  sticker: 0.08,
  "title-card": 0.46,
  list: 1,
  title: 0.24,
  counter: 0.18,
  "corner-label": 0.05,
};

const gutter = 0.04;
const scanStep = 0.02;
const scanEpsilon = 1e-9;
const aboveMiddleCost = 0.05;
const titleMargin = 1.15;
const captionBottomGap = 0.02;
const captionBandHeight = 0.1;

// Soft zones (faces) are avoided when a spot allows; hard zones (captions, placed elements) are covered only
// when every spot covers them.
export function placeOverlay(
  kind: OverlayKind,
  format: Format,
  safeZone: SafeZone,
  avoid: Avoid,
  options: PlaceOptions = {},
): Box {
  const inner = innerArea(safeZone);
  const onBackdrop = options.onBackdrop ?? false;
  const size = options.measured ?? overlaySize(kind, inner, onBackdrop, titleHeight(format, inner, options));
  const order = slotsFor(kind, onBackdrop);
  const found = [...preferredSlots(order, inner, size), ...scannedSlots(order, inner, size)];
  const slots = onBackdrop && backdropSlots[kind] ? nearestTheMiddle(found) : found;
  const clear = slots.filter((box) => !avoid.hard.some((zone) => boxesOverlap(box, zone)));
  const candidates = clear.length > 0 ? clear : slots;
  const zones = [...avoid.soft, ...avoid.hard];

  const free = candidates.find((box) => !zones.some((zone) => boxesOverlap(box, zone)));
  if (free) return free;

  return leastCovered(candidates, zones);
}

// Centered on the frame: the wider side margin is used on both sides.
export function captionBand(safeZone: SafeZone): Box {
  const margin = Math.max(safeZone.left, safeZone.right);

  return {
    x: margin,
    y: round6(1 - safeZone.bottom - captionBottomGap - captionBandHeight),
    w: round6(1 - 2 * margin),
    h: captionBandHeight,
  };
}

// Elements keep a gutter from the safe zone, so nothing sits flush against the edge of the usable area.
export function innerArea(safeZone: SafeZone): Inner {
  return {
    left: safeZone.left + gutter,
    right: 1 - safeZone.right - gutter,
    top: safeZone.top + gutter,
    bottom: 1 - safeZone.bottom - gutter,
  };
}

function overlaySize(
  kind: OverlayKind,
  inner: Inner,
  onBackdrop: boolean,
  titleShare: number | undefined,
): Size {
  const scale = onBackdrop && isKineticKind(kind) ? backdropTypeScale : 1;
  const h = kind === "title" && titleShare !== undefined ? titleShare : heightShare[kind];
  return { w: round6((inner.right - inner.left) * widthShare[kind]), h: round6(h * scale) };
}

// The lines' largest sizes stacked at their line height, with a margin; the slot height when lines are unknown.
function titleHeight(format: Format, inner: Inner, options: PlaceOptions): number | undefined {
  if (!options.titleSizes) return undefined;
  const { width, height } = formatSize(format);
  const titleWidthPx = (inner.right - inner.left) * widthShare.title * width;
  const stacked = options.titleSizes.reduce((sum, size) => sum + titleSizeShare[size], 0);

  return Math.min(heightShare.title, (stacked * titleWidthPx * titleLineHeight * titleMargin) / height);
}

// Things on a backdrop gather around the middle: the free spot closest to it comes first, and below wins
// over above, so labels read in the order they arrive.
function nearestTheMiddle(boxes: Box[]): Box[] {
  const distance = (box: Box) => {
    const offset = box.y + box.h / 2 - 0.5;
    return Math.abs(offset) + (offset < 0 ? aboveMiddleCost : 0);
  };
  return [...boxes].sort((a, b) => distance(a) - distance(b));
}

function slotsFor(kind: OverlayKind, onBackdrop: boolean): Slot[] {
  const centered = backdropSlots[kind];
  return onBackdrop && centered ? centered : slotsByKind[kind];
}

function preferredSlots(order: Slot[], inner: Inner, size: Size): Box[] {
  return order.map(([horizontal, vertical]) =>
    boxAt(xAt(horizontal, inner, size), yAt(vertical, inner, size), size),
  );
}

function scannedSlots(order: Slot[], inner: Inner, size: Size): Box[] {
  const horizontals = [...new Set(order.map(([horizontal]) => horizontal))];
  const boxes: Box[] = [];

  for (let y = inner.top; y <= inner.bottom - size.h + scanEpsilon; y += scanStep) {
    for (const horizontal of horizontals) boxes.push(boxAt(xAt(horizontal, inner, size), y, size));
  }

  return boxes;
}

function leastCovered(candidates: Box[], avoid: Box[]): Box {
  return candidates.reduce((best, box) =>
    overlapRatio(box, avoid) < overlapRatio(best, avoid) ? box : best,
  );
}

function xAt(horizontal: Horizontal, inner: Inner, size: Size): number {
  if (horizontal === "left") return inner.left;
  if (horizontal === "right") return inner.right - size.w;
  return clamp(0.5 - size.w / 2, inner.left, inner.right - size.w);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function yAt(vertical: Vertical, inner: Inner, size: Size): number {
  if (vertical === "top") return inner.top;
  if (vertical === "bottom") return inner.bottom - size.h;
  return inner.top + (inner.bottom - inner.top - size.h) / 2;
}

function boxAt(x: number, y: number, size: Size): Box {
  return { x: round6(x), y: round6(y), w: size.w, h: size.h };
}
