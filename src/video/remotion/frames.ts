export const fps = 30;

type Timed = { startMs: number; durationMs: number };

export function msToFrame(ms: number, rate = fps): number {
  return Math.round((ms / 1000) * rate);
}

export function frameToMs(frame: number, rate = fps): number {
  return (frame / rate) * 1000;
}

export function sceneFrames(scene: Timed, rate = fps): { from: number; durationInFrames: number } {
  const from = msToFrame(scene.startMs, rate);
  const to = msToFrame(scene.startMs + scene.durationMs, rate);

  return { from, durationInFrames: to - from };
}
