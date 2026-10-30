import type { Tempo } from "./tempo";
import { eased, linear, smoothstep } from "./timeline";

export type Enter = "cut" | "fade" | "pop" | "punch" | "rise" | "lift" | "drop" | "smear" | "reveal";

export type Exit = "cut" | "fade" | "collapse" | "sink" | "smear" | "tilt";

export type Pose = {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  scaleX: number;
  rotateY: number;
  blur: number;
  smear: number;
  clipRight: number;
  maskY: number;
};

export type MoveSpec = { enter: Enter; atMs: number; exit?: { move: Exit; atMs: number } };

export type Progress = { eased: number; linear: number };

export const restPose: Pose = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  rotateY: 0,
  blur: 0,
  smear: 0,
  clipRight: 0,
  maskY: 0,
};

const enterLength: Record<Enter, number> = {
  cut: 0,
  fade: 1,
  pop: 1,
  punch: 1.6,
  rise: 1,
  lift: 1,
  drop: 1.2,
  smear: 1,
  reveal: 1.4,
};

const exitLength: Record<Exit, number> = { cut: 0, fade: 1, collapse: 1, sink: 1, smear: 1, tilt: 1.6 };

const popFromScale = 0.6;
const punchFromScale = 3.2;
const dropFromY = -0.6;
const liftFromY = 0.12;
const smearDistance = 0.8;
const smearStretch = 0.4;
const smearBlur = 0.6;
const collapseToScale = 0.2;
const tiltToDegrees = -40;
const tiltToX = -0.6;
const tiltToScale = 0.7;
const fadeInShare = 0.4;
const fadeOutShare = 0.8;

export function enterMs(move: Enter, tempo: Tempo): number {
  return Math.round(enterLength[move] * tempo.moveMs);
}

export function exitMs(move: Exit, tempo: Tempo): number {
  return Math.round(exitLength[move] * tempo.moveMs);
}

export function poseAt(ms: number, spec: MoveSpec, tempo: Tempo): Pose | null {
  if (ms < spec.atMs) return null;
  if (spec.exit && ms > spec.exit.atMs + exitMs(spec.exit.move, tempo)) return null;

  const enterCurve = spec.enter === "pop" ? tempo.popCurve : tempo.enterCurve;
  const entered = enterPose(spec.enter, progress(ms, spec.atMs, enterMs(spec.enter, tempo), enterCurve));
  if (!spec.exit) return entered;

  const left = progress(ms, spec.exit.atMs, exitMs(spec.exit.move, tempo), tempo.exitCurve);
  return combine(entered, exitPose(spec.exit.move, left));
}

export function enterPose(move: Enter, { eased: p, linear: t }: Progress): Pose {
  const away = 1 - p;
  const shown = smoothstep(Math.min(1, t / fadeInShare));

  switch (move) {
    case "cut":
      return restPose;
    case "fade":
      return { ...restPose, opacity: smoothstep(t) };
    case "pop":
      return { ...restPose, opacity: shown, scale: popFromScale + (1 - popFromScale) * p };
    case "punch":
      return { ...restPose, opacity: shown, scale: punchFromScale + (1 - punchFromScale) * p };
    case "rise":
      return { ...restPose, maskY: away };
    case "lift":
      return { ...restPose, opacity: shown, y: liftFromY * away };
    case "drop":
      return { ...restPose, opacity: shown, y: dropFromY * away };
    case "smear":
      return smearPose(-away, shown);
    case "reveal":
      return { ...restPose, clipRight: away };
  }
}

export function exitPose(move: Exit, { eased: q, linear: t }: Progress): Pose {
  const left = 1 - smoothstep(Math.min(1, t / fadeOutShare));

  switch (move) {
    case "cut":
      return t >= 1 ? { ...restPose, opacity: 0 } : restPose;
    case "fade":
      return { ...restPose, opacity: 1 - smoothstep(t) };
    case "collapse":
      return { ...restPose, opacity: left, scale: 1 - (1 - collapseToScale) * q };
    case "sink":
      return { ...restPose, maskY: q };
    case "smear":
      return smearPose(q, left);
    case "tilt":
      return {
        ...restPose,
        opacity: left,
        x: tiltToX * q,
        rotateY: tiltToDegrees * q,
        scale: 1 - (1 - tiltToScale) * q,
      };
  }
}

export function combine(a: Pose, b: Pose): Pose {
  return {
    opacity: a.opacity * b.opacity,
    x: a.x + b.x,
    y: a.y + b.y,
    scale: a.scale * b.scale,
    scaleX: a.scaleX * b.scaleX,
    rotateY: a.rotateY + b.rotateY,
    blur: a.blur + b.blur,
    smear: a.smear + b.smear,
    clipRight: Math.max(a.clipRight, b.clipRight),
    maskY: a.maskY + b.maskY,
  };
}

export function flipFace(p: number): { scaleX: number; back: boolean } {
  return { scaleX: Math.abs(Math.cos(Math.PI * p)), back: p >= 0.5 };
}

export function mix(from: number, to: number, p: number): number {
  return from + (to - from) * p;
}

function progress(ms: number, startMs: number, durationMs: number, curve: Tempo["enterCurve"]): Progress {
  return { eased: eased(ms, startMs, durationMs, curve), linear: linear(ms, startMs, durationMs) };
}

function smearPose(offset: number, opacity: number): Pose {
  const amount = Math.abs(offset);

  return {
    ...restPose,
    opacity,
    x: smearDistance * offset,
    scaleX: 1 + smearStretch * amount,
    smear: smearBlur * amount,
  };
}
