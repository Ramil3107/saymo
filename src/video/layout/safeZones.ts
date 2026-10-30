import type { Format, SafeZone } from "../destinations";
import type { Box } from "../schema/content";
import type { OverlayKind } from "../schema/plan";
import { boxesOverlap, round6 } from "./geometry";
import { overlapRatio } from "./keepOut";

type Horizontal = "left" | "center" | "right";
type Vertical = "top" | "middle" | "bottom";
type Slot = [Horizontal, Vertical];
type Inner = { left: number; right: number; top: number; bottom: number };
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
};

const gutter = 0.04;
const scanStep = 0.02;
const scanEpsilon = 1e-9;
const captionBottomGap = 0.02;
const captionBandHeight = 0.1;

export function placeOverlay(
  kind: OverlayKind,
  _format: Format,
  safeZone: SafeZone,
  avoid: Box[],
  measured?: Size,
): Box {
  const inner = innerArea(safeZone);
  const size = measured ?? overlaySize(kind, inner);
  const candidates = [...preferredSlots(kind, inner, size), ...scannedSlots(kind, inner, size)];

  const free = candidates.find((box) => !avoid.some((zone) => boxesOverlap(box, zone)));
  if (free) return free;

  return leastCovered(candidates, avoid);
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
function innerArea(safeZone: SafeZone): Inner {
  return {
    left: safeZone.left + gutter,
    right: 1 - safeZone.right - gutter,
    top: safeZone.top + gutter,
    bottom: 1 - safeZone.bottom - gutter,
  };
}

function overlaySize(kind: OverlayKind, inner: Inner): Size {
  return { w: round6((inner.right - inner.left) * widthShare[kind]), h: heightShare[kind] };
}

function preferredSlots(kind: OverlayKind, inner: Inner, size: Size): Box[] {
  return slotsByKind[kind].map(([horizontal, vertical]) =>
    boxAt(xAt(horizontal, inner, size), yAt(vertical, inner, size), size),
  );
}

function scannedSlots(kind: OverlayKind, inner: Inner, size: Size): Box[] {
  const horizontals = [...new Set(slotsByKind[kind].map(([horizontal]) => horizontal))];
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
