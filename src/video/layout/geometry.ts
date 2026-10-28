import type { Box } from "../schema/content";

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function padBox(box: Box, padding: number): Box {
  const x = clamp01(box.x - padding);
  const y = clamp01(box.y - padding);
  const right = clamp01(box.x + box.w + padding);
  const bottom = clamp01(box.y + box.h + padding);

  return { x, y, w: round6(right - x), h: round6(bottom - y) };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function unionBox(a: Box, b: Box): Box {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.w, b.x + b.w);
  const bottom = Math.max(a.y + a.h, b.y + b.h);

  return { x, y, w: round6(right - x), h: round6(bottom - y) };
}

export function intersectionArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

  return w > 0 && h > 0 ? w * h : 0;
}
