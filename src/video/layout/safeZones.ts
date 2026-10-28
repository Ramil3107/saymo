import type { Destination, Format } from "../destinations";
import type { Box } from "../schema/content";
import type { OverlayKind } from "../schema/plan";

type Horizontal = "left" | "center" | "right";
type Vertical = "top" | "middle" | "bottom";
type Slot = [Horizontal, Vertical];

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
};

const widthShare: Record<OverlayKind, number> = {
  headline: 0.84,
  quote: 0.84,
  "big-number": 0.6,
  "lower-third": 0.6,
  chip: 0.36,
  sticker: 0.36,
};

const heightShare: Record<OverlayKind, number> = {
  headline: 0.18,
  quote: 0.12,
  "big-number": 0.12,
  chip: 0.08,
  "lower-third": 0.08,
  sticker: 0.08,
};

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;
const captionBottomGap = 0.02;
const captionBandHeight = 0.1;

export function captionBand(safeZone: Destination["safeZone"]): Box {
  return {
    x: safeZone.left,
    y: round6(1 - safeZone.bottom - captionBottomGap - captionBandHeight),
    w: round6(1 - safeZone.left - safeZone.right),
    h: captionBandHeight,
  };
}

function intersects(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

export function placeOverlay(
  kind: OverlayKind,
  _format: Format,
  safeZone: Destination["safeZone"],
  avoid: Box[],
): Box {
  const inner = {
    left: safeZone.left,
    right: 1 - safeZone.right,
    top: safeZone.top,
    bottom: 1 - safeZone.bottom,
  };
  const w = round6((inner.right - inner.left) * widthShare[kind]);
  const h = heightShare[kind];
  const xFor: Record<Horizontal, number> = {
    left: inner.left,
    center: inner.left + (inner.right - inner.left - w) / 2,
    right: inner.right - w,
  };
  const yFor: Record<Vertical, number> = {
    top: inner.top,
    middle: inner.top + (inner.bottom - inner.top - h) / 2,
    bottom: inner.bottom - h,
  };
  const candidates = slotsByKind[kind].map(([horizontal, vertical]) => ({
    x: round6(xFor[horizontal]),
    y: round6(yFor[vertical]),
    w,
    h,
  }));
  return (
    candidates.find((box) => !avoid.some((zone) => intersects(box, zone))) ??
    (candidates[0] as Box)
  );
}
