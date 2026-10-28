export const fps = 30;

export function msToFrame(ms: number, rate = fps): number {
  return Math.round((ms / 1000) * rate);
}

export function frameToMs(frame: number, rate = fps): number {
  return (frame / rate) * 1000;
}

export function sceneFrames(
  scene: { startMs: number; durationMs: number },
  rate = fps,
): { from: number; durationInFrames: number } {
  const from = msToFrame(scene.startMs, rate);
  return {
    from,
    durationInFrames: msToFrame(scene.startMs + scene.durationMs, rate) - from,
  };
}
