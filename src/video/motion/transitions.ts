import type { Transition } from "../schema/video";
import type { Tempo } from "./tempo";
import { eased, smoothstep } from "./timeline";

export type Side = "out" | "in";

export type TransitionPhase = { kind: Transition; side: Side; p: number };

export type TransitionLook = {
  x: number;
  scale: number;
  blur: number;
  smear: number;
  pixel: number;
  cover: number;
  panel: { left: number; right: number } | null;
};

const halfMoves: Record<Transition, number> = {
  cut: 0,
  flash: 0,
  wipe: 1.5,
  whip: 1,
  zoom: 1.2,
  pixelate: 1.2,
  dip: 1.5,
};
const whipTravel = 0.6;
const zoomOutTo = 2.6;
const zoomInFrom = 1.8;

const still: TransitionLook = { x: 0, scale: 1, blur: 0, smear: 0, pixel: 0, cover: 0, panel: null };

export function transitionHalfMs(kind: Transition, tempo: Tempo): number {
  if (kind === "flash") return tempo.flashMs > 0 ? tempo.flashMs : tempo.quickMs;
  return Math.round(halfMoves[kind] * tempo.moveMs);
}

export function transitionPhase(
  ms: number,
  sceneMs: number,
  edges: { into: Transition; outof: Transition },
  tempo: Tempo,
): TransitionPhase | null {
  const inMs = transitionHalfMs(edges.into, tempo);
  if (inMs > 0 && ms < inMs) return { kind: edges.into, side: "in", p: ms / inMs };

  const outMs = transitionHalfMs(edges.outof, tempo);
  if (outMs > 0 && ms >= sceneMs - outMs)
    return { kind: edges.outof, side: "out", p: (ms - (sceneMs - outMs)) / outMs };

  return null;
}

export function transitionLook({ kind, side, p }: TransitionPhase, tempo: Tempo): TransitionLook {
  const away = side === "out" ? eased(p, 0, 1, tempo.exitCurve) : 1 - eased(p, 0, 1, tempo.enterCurve);

  switch (kind) {
    case "cut":
      return still;
    case "flash":
      return { ...still, cover: flashCover(side, p, tempo) };
    case "dip":
      return { ...still, cover: side === "out" ? smoothstep(p) : 1 - smoothstep(p) };
    case "wipe":
      return { ...still, panel: wipePanel(side, eased(p, 0, 1, tempo.moveCurve)) };
    case "whip":
      return { ...still, x: (side === "out" ? -1 : 1) * whipTravel * away, smear: away };
    case "zoom":
      return {
        ...still,
        scale: side === "out" ? 1 + (zoomOutTo - 1) * away : 1 + (zoomInFrom - 1) * away,
        blur: away,
      };
    case "pixelate":
      return { ...still, pixel: away };
  }
}

function flashCover(side: Side, p: number, tempo: Tempo): number {
  if (tempo.flashMs > 0) return 1;
  return side === "out" ? p : 1 - p;
}

function wipePanel(side: Side, covered: number): { left: number; right: number } {
  return side === "out" ? { left: 0, right: covered } : { left: covered, right: 1 };
}
