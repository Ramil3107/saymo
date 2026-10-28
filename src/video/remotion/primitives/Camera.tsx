import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Scene } from "../../schema/video";
import { frameToMs } from "../frames";

export function Camera({
  camera,
  durationMs,
  children,
}: {
  camera: Scene["camera"];
  durationMs: number;
  children: ReactNode;
}) {
  const ms = frameToMs(useCurrentFrame());
  const intensity = camera?.intensity ?? 0;
  let transform = "none";
  if (camera?.kind === "push") {
    const scale = interpolate(ms, [0, durationMs], [1, 1 + 0.08 * intensity], {
      extrapolateRight: "clamp",
    });
    transform = `scale(${scale})`;
  } else if (camera?.kind === "punch-in") {
    transform = `scale(${1 + 0.15 * intensity})`;
  } else if (camera?.kind === "pan") {
    const shift = interpolate(ms, [0, durationMs], [0, 4 * intensity], {
      extrapolateRight: "clamp",
    });
    transform = `translateX(${shift}%) scale(${1 + 0.04 * intensity})`;
  }
  return (
    <AbsoluteFill style={{ transform, transformOrigin: "center" }}>
      {children}
    </AbsoluteFill>
  );
}
