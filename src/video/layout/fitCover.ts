type Size = { width: number; height: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function fitCover(
  source: Size,
  target: Size,
  focus?: { x: number; y: number },
): { scale: number; x: number; y: number } {
  const scale = Math.max(
    target.width / source.width,
    target.height / source.height,
  );
  const scaled = { width: source.width * scale, height: source.height * scale };
  const minX = target.width - scaled.width;
  const minY = target.height - scaled.height;
  if (!focus) return { scale, x: minX / 2, y: minY / 2 };
  return {
    scale,
    x: clamp(target.width / 2 - focus.x * scaled.width, minX, 0),
    y: clamp(target.height / 2 - focus.y * scaled.height, minY, 0),
  };
}
