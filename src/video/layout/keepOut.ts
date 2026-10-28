import type { Box, FaceBox } from "../schema/content";

type Size = { width: number; height: number };
type Transform = { scale: number; x: number; y: number };

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function mapBoxThroughTransform(
  box: Box,
  source: Size,
  transform: Transform,
  target: Size,
): Box {
  const left = clamp01(
    (box.x * source.width * transform.scale + transform.x) / target.width,
  );
  const top = clamp01(
    (box.y * source.height * transform.scale + transform.y) / target.height,
  );
  const right = clamp01(
    ((box.x + box.w) * source.width * transform.scale + transform.x) /
      target.width,
  );
  const bottom = clamp01(
    ((box.y + box.h) * source.height * transform.scale + transform.y) /
      target.height,
  );
  return {
    x: round6(left),
    y: round6(top),
    w: round6(right - left),
    h: round6(bottom - top),
  };
}

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

export function keepOutZones(input: {
  faces: FaceBox[];
  window: { startMs: number; endMs: number };
  source: Size;
  transform: Transform;
  target: Size;
  padding?: number;
}): Box[] {
  const padding = input.padding ?? 0.02;
  return input.faces
    .filter(
      (face) =>
        face.tMs >= input.window.startMs && face.tMs <= input.window.endMs,
    )
    .map((face) =>
      pad(
        mapBoxThroughTransform(
          face,
          input.source,
          input.transform,
          input.target,
        ),
        padding,
      ),
    )
    .filter((zone) => zone.w > 0 && zone.h > 0);
}

export function overlapRatio(element: Box, zones: Box[]): number {
  const area = element.w * element.h;
  if (area === 0) return 0;
  let covered = 0;
  for (const zone of zones) {
    const w =
      Math.min(element.x + element.w, zone.x + zone.w) -
      Math.max(element.x, zone.x);
    const h =
      Math.min(element.y + element.h, zone.y + zone.h) -
      Math.max(element.y, zone.y);
    if (w > 0 && h > 0) covered = Math.max(covered, w * h);
  }
  return Math.min(1, covered / area);
}
