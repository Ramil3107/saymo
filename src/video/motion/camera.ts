import type { Camera } from "../schema/plan";

export const pushZoom = 0.08;
export const punchInZoom = 0.15;
export const panZoom = 0.04;
export const panShiftPercent = 4;

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
