import type { FieldTone } from "../../layout/compositions";
import { backdropTypeScale } from "../../layout/safeZones";
import type { StyleKit } from "../style/kit";
import type { TypeColors } from "../type/KineticTitle";

export type Surface = "footage" | "backdrop";

const noMarker = "transparent";

export function typeScale(surface: Surface): number {
  return surface === "backdrop" ? backdropTypeScale : 1;
}

// Text on a color field takes the colors that read on it; otherwise the surface decides.
export function typeColors(kit: StyleKit, surface: Surface, on: FieldTone | undefined): TypeColors {
  if (on) {
    const field = kit.fields[on];
    return { ink: field.ink, accent: field.accent, alt: field.ink, marker: field.marker ?? noMarker };
  }

  return surface === "footage" ? kit.onFootage : kit.colors;
}
