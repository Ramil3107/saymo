import type { Tones } from "../styles";
import { luminance, mixHex, readableOn } from "./color";

export type Palette = Tones & { accent: string; alt: string };

const textRatio = 3;
const lightLuminance = 0.5;
const altDepth = 0.45;

// The brand gives the accent; a light brand color becomes the highlight; what is left, or a deeper accent, is the second tone.
export function brandPalette(tones: Tones, brandColors: string[]): Palette {
  const [accentSource, ...rest] = brandColors.filter((color) => !isNearWhite(color));
  const accent = readableOn(accentSource ?? tones.ink, tones.background, textRatio);
  const light = rest.find((color) => (luminance(color) ?? 0) > lightLuminance);
  const dark = rest.find((color) => color !== light);

  return {
    ...tones,
    accent,
    highlight: light ?? tones.highlight,
    alt: dark ? readableOn(dark, tones.background, textRatio) : mixHex(accent, tones.ink, altDepth),
  };
}

function isNearWhite(color: string): boolean {
  return (luminance(color) ?? 0) > 0.9;
}
