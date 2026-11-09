import type { Camera } from "../schema/plan";
import type { Tempo } from "./tempo";
import { eased, linear } from "./timeline";

// How the camera frames the backdrop: x and y shift it by shares of the frame, scale grows it about the middle.
export type BackdropView = { scale: number; x: number; y: number };

export const pushZoom = 0.08;
export const punchInZoom = 0.15;
export const panZoom = 0.04;
export const panShiftPercent = 4;

export const backdropPushZoom = 0.12;
export const backdropPunchZoom = 0.18;
export const backdropPanShare = 0.1;

const punchMoves = 2;
const punchCreep = 0.03;
const panMargin = 0.01;
const panRise = 0.25;
const rest: BackdropView = { scale: 1, x: 0, y: 0 };

// The largest scale a camera move reaches during its scene, so layout can keep faces clear at that size.
export function cameraZoom(camera: Camera | undefined): number {
  if (!camera) return 1;

  switch (camera.kind) {
    case "none":
      return 1;
    case "push":
      return 1 + pushZoom * camera.intensity;
    case "punch-in":
      return 1 + punchInZoom * camera.intensity;
    case "pan":
      return 1 + panZoom * camera.intensity;
  }
}

// The camera over the backdrop of a beat without footage: a push and a pan move through the whole beat, a punch-in
// snaps in on the tempo and keeps creeping, so a moving backdrop never stops on a fractional position.
export function backdropView(
  camera: Camera | undefined,
  ms: number,
  durationMs: number,
  tempo: Tempo,
): BackdropView {
  if (!camera) return rest;
  const progress = linear(ms, 0, durationMs);

  switch (camera.kind) {
    case "none":
      return rest;
    case "push":
      return { scale: 1 + backdropPushZoom * camera.intensity * progress, x: 0, y: 0 };
    case "punch-in":
      return { scale: punchScale(camera.intensity, ms, durationMs, tempo), x: 0, y: 0 };
    case "pan":
      return panView(camera.intensity, progress);
  }
}

function punchScale(intensity: number, ms: number, durationMs: number, tempo: Tempo): number {
  const snapMs = tempo.moveMs * punchMoves;
  const snapped = eased(ms, 0, snapMs, tempo.popCurve);
  const crept = linear(ms, snapMs, durationMs - snapMs);

  return 1 + intensity * (backdropPunchZoom * snapped + punchCreep * crept);
}

// A pan slides from right to left and a little downward, grown just enough that no edge comes into view.
function panView(intensity: number, progress: number): BackdropView {
  const travel = backdropPanShare * intensity;

  return {
    scale: 1 + travel + panMargin * intensity,
    x: travel * (0.5 - progress),
    y: travel * panRise * (progress - 0.5),
  };
}
