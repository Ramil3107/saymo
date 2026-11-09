import type { Ground } from "../backdrops";
import type { FieldTone } from "./compositions";

// A field never takes the backdrop's own tone: on a color backdrop an accent field turns ink; on a dark one an ink
// field turns accent and the dark second tone turns highlight.
export function toneOnGround(tone: FieldTone, ground: Ground | undefined): FieldTone {
  if (ground === "accent" && tone === "accent") return "ink";
  if (ground === "ink" && tone === "ink") return "accent";
  if (ground === "ink" && tone === "alt") return "highlight";

  return tone;
}
