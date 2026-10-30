type Size = { width: number; height: number };
type Point = { x: number; y: number };
type Margins = { top?: number; bottom?: number; left?: number; right?: number };

export type CoverTransform = { scale: number; x: number; y: number };

export type CoverOptions = {
  anchor?: Point;
  zoom?: number;
  free?: Margins;
};

const center: Point = { x: 0.5, y: 0.5 };

// Scales the source to cover the target, then slides it so the focus lands on the anchor.
// `free` names the frame edges a panel hides, so the footage may stop short of them.
export function fitCover(
  source: Size,
  target: Size,
  focus?: Point,
  options: CoverOptions = {},
): CoverTransform {
  const scale = Math.max(target.width / source.width, target.height / source.height) * (options.zoom ?? 1);
  const scaled = { width: source.width * scale, height: source.height * scale };
  const free = { top: 0, bottom: 0, left: 0, right: 0, ...options.free };
  const anchor = options.anchor ?? center;
  const at = focus ?? center;

  const minX = target.width * (1 - free.right) - scaled.width;
  const maxX = target.width * free.left;
  const minY = target.height * (1 - free.bottom) - scaled.height;
  const maxY = target.height * free.top;

  return {
    scale,
    x: clamp(target.width * anchor.x - at.x * scaled.width, minX, maxX),
    y: clamp(target.height * anchor.y - at.y * scaled.height, minY, maxY),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
