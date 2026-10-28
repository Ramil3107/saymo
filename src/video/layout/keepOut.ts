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

export function overlapRatio(element: Box, zones: Box[]): number {
  const area = element.w * element.h;
  if (area === 0) return 0;

  const covered = Math.max(0, ...zones.map((zone) => intersectionArea(element, zone)));

  return Math.min(1, covered / area);
}
