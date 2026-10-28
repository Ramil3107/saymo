import type { Box, FaceBox } from "../schema/content";
import { boxesOverlap, padBox, unionBox } from "./geometry";

type Interval = { startMs: number; endMs: number };

const defaultPadding = 0.04;

export function avoidZones(faces: FaceBox[], interval: Interval, padding = defaultPadding): Box[] {
  const inside = faces.filter((face) => face.tMs >= interval.startMs && face.tMs <= interval.endMs);
  const padded = inside.map((face) => padBox(face, padding));

  return mergeOverlapping(padded);
}

function mergeOverlapping(boxes: Box[]): Box[] {
  let merged: Box[] = [];
  for (const box of boxes) merged = absorb(box, merged);

  return merged;
}

function absorb(box: Box, merged: Box[]): Box[] {
  const kept: Box[] = [];
  let grown = box;

  for (const other of [...merged].reverse()) {
    if (boxesOverlap(grown, other)) grown = unionBox(grown, other);
    else kept.unshift(other);
  }

  return [...kept, grown];
}
