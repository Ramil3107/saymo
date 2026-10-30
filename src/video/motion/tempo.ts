import { z } from "zod";

export const TempoIdSchema = z.enum(["snap", "glide"]);

export type TempoId = z.infer<typeof TempoIdSchema>;

export type Curve = readonly [number, number, number, number];

export type Tempo = {
  moveMs: number;
  quickMs: number;
  staggerMs: number;
  wordMs: number;
  letterMs: number;
  blinkMs: number;
  countStepMs: number;
  flashMs: number;
  enterCurve: Curve;
  exitCurve: Curve;
  moveCurve: Curve;
  popCurve: Curve;
};

export const tempos: Record<TempoId, Tempo> = {
  snap: {
    moveMs: 133,
    quickMs: 67,
    staggerMs: 33,
    wordMs: 100,
    letterMs: 33,
    blinkMs: 330,
    countStepMs: 100,
    flashMs: 67,
    enterCurve: [0.16, 1, 0.3, 1],
    exitCurve: [0.5, 0, 0.75, 0],
    moveCurve: [0.87, 0, 0.13, 1],
    popCurve: [0.34, 1.56, 0.64, 1],
  },
  glide: {
    moveMs: 360,
    quickMs: 220,
    staggerMs: 120,
    wordMs: 240,
    letterMs: 90,
    blinkMs: 1060,
    countStepMs: 0,
    flashMs: 0,
    enterCurve: [0.22, 1, 0.36, 1],
    exitCurve: [0.32, 0, 0.67, 0],
    moveCurve: [0.83, 0, 0.17, 1],
    popCurve: [0.34, 1.3, 0.64, 1],
  },
};
