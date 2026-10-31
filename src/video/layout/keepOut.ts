import type { Box, FaceBox } from "../schema/content";
import { clamp01, intersectionArea, padBox, round6 } from "./geometry";

type Size = { width: number; height: number };
type Transform = { scale: number; x: number; y: number };
type Interval = { startMs: number; endMs: number };

type KeepOutInput = {
  faces: FaceBox[];
  window: Interval;
  source: Size;
  transform: Transform;
  target: Size;
  padding?: number;
};

const defaultPadding = 0.02;

// An element that covers more of a keep-out zone than this is not placed at all.
export const keepOutErrorShare = 0.5;

export function keepOutZones(input: KeepOutInput): Box[] {
  const padding = input.padding ?? defaultPadding;

  return input.faces
    .filter((face) => face.tMs >= input.window.startMs && face.tMs <= input.window.endMs)
    .map((face) => mapBoxThroughTransform(face, input.source, input.transform, input.target))
    .map((zone) => padBox(zone, padding))
    .filter((zone) => zone.w > 0 && zone.h > 0);
}

export function mapBoxThroughTransform(box: Box, source: Size, transform: Transform, target: Size): Box {
  const toTargetX = (fraction: number) =>
    clamp01((fraction * source.width * transform.scale + transform.x) / target.width);
  const toTargetY = (fraction: number) =>
    clamp01((fraction * source.height * transform.scale + transform.y) / target.height);

  const left = toTargetX(box.x);
  const right = toTargetX(box.x + box.w);
  const top = toTargetY(box.y);
  const bottom = toTargetY(box.y + box.h);

  return { x: round6(left), y: round6(top), w: round6(right - left), h: round6(bottom - top) };
}

// A camera that zooms around the frame's center makes a face cover more of the frame by the end of the scene.
export function zoomedZones(zones: Box[], scale: number): Box[] {
  return zones.map((zone) => {
    const left = clamp01(0.5 + (zone.x - 0.5) * scale);
    const top = clamp01(0.5 + (zone.y - 0.5) * scale);
    const right = clamp01(0.5 + (zone.x + zone.w - 0.5) * scale);
    const bottom = clamp01(0.5 + (zone.y + zone.h - 0.5) * scale);

    return { x: round6(left), y: round6(top), w: round6(right - left), h: round6(bottom - top) };
  });
}

export function overlapRatio(element: Box, zones: Box[]): number {
  const area = element.w * element.h;
  if (area === 0) return 0;

  const covered = Math.max(0, ...zones.map((zone) => intersectionArea(element, zone)));

  return Math.min(1, covered / area);
}
