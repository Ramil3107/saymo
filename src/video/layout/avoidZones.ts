import type { Box, FaceBox } from "../schema/content";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

function pad(box: Box, padding: number): Box {
  const x = clamp01(box.x - padding);
  const y = clamp01(box.y - padding);
  return {
    x,
    y,
    w: round6(clamp01(box.x + box.w + padding) - x),
    h: round6(clamp01(box.y + box.h + padding) - y),
  };
}

function overlaps(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

function union(a: Box, b: Box): Box {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: round6(Math.max(a.x + a.w, b.x + b.w) - x),
    h: round6(Math.max(a.y + a.h, b.y + b.h) - y),
  };
}

function mergeOverlapping(boxes: Box[]): Box[] {
  const merged: Box[] = [];
  for (const box of boxes) {
    let current = box;
    for (let i = merged.length - 1; i >= 0; i -= 1) {
      const other = merged[i] as Box;
      if (overlaps(current, other)) {
        current = union(current, other);
        merged.splice(i, 1);
      }
    }
    merged.push(current);
  }
  return merged;
}

export function avoidZones(
  faces: FaceBox[],
  interval: { startMs: number; endMs: number },
  padding = 0.04,
): Box[] {
  const inside = faces.filter(
    (face) => face.tMs >= interval.startMs && face.tMs <= interval.endMs,
  );
  return mergeOverlapping(
    inside.map(({ x, y, w, h }) => pad({ x, y, w, h }, padding)),
  );
}
