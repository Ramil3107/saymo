import { backdropTypeScale } from "../../layout/safeZones";

export type Surface = "footage" | "backdrop";

export function typeScale(surface: Surface): number {
  return surface === "backdrop" ? backdropTypeScale : 1;
}
