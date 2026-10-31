import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { panShiftPercent, panZoom, punchInZoom, pushZoom } from "../../motion/camera";
import type { Scene } from "../../schema/video";
import { frameToMs } from "../frames";

type SceneCamera = Scene["camera"];

export function Camera({
  camera,
  durationMs,
  children,
}: {
  camera: SceneCamera;
  durationMs: number;
  children: ReactNode;
}) {
  const ms = frameToMs(useCurrentFrame());
  const transform = cameraTransform(camera, ms, durationMs);

  return <AbsoluteFill style={{ transform, transformOrigin: "center" }}>{children}</AbsoluteFill>;
}

function cameraTransform(camera: SceneCamera, ms: number, durationMs: number): string {
  if (!camera || camera.kind === "none") return "none";

  const intensity = camera.intensity;
  const progress = interpolate(ms, [0, durationMs], [0, 1], { extrapolateRight: "clamp" });

  switch (camera.kind) {
    case "push":
      return `scale(${1 + pushZoom * intensity * progress})`;
    case "punch-in":
      return `scale(${1 + punchInZoom * intensity})`;
    case "pan":
      return `translateX(${panShiftPercent * intensity * progress}%) scale(${1 + panZoom * intensity})`;
  }
}
