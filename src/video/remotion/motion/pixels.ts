// Renderer tabs round fractional positions differently, so a still element drawn by two tabs would jump a pixel.
export function wholePx(value: number): number {
  return Math.round(value);
}

export function restingTransform(transform: string, atRest: boolean): string | undefined {
  return atRest ? undefined : transform;
}
