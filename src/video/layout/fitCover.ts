type Size = { width: number; height: number };
type Point = { x: number; y: number };

export type CoverTransform = { scale: number; x: number; y: number };

export function fitCover(source: Size, target: Size, focus?: Point): CoverTransform {
  const scale = Math.max(target.width / source.width, target.height / source.height);
  const scaled = { width: source.width * scale, height: source.height * scale };
  const overflowX = scaled.width - target.width;
  const overflowY = scaled.height - target.height;

  if (!focus) return { scale, x: -overflowX / 2, y: -overflowY / 2 };

  return {
    scale,
    x: clamp(target.width / 2 - focus.x * scaled.width, -overflowX, 0),
    y: clamp(target.height / 2 - focus.y * scaled.height, -overflowY, 0),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
