import type { FieldTone } from "../layout/compositions";
import type { Tones } from "../styles";
import { contrastRatio, luminance, mixHex, readableOn } from "./color";

export type Palette = Tones & { accent: string; alt: string };

export type FieldColors = { background: string; ink: string; accent: string };

const textRatio = 3;
const lightLuminance = 0.5;
const altDepth = 0.45;
const white = "#FFFFFF";

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

// Text on a color field: ink or white, whichever reads better, and the first palette color that reads on it.
export function fieldColors(palette: Palette, tone: FieldTone): FieldColors {
  const background = palette[tone];
  const ink =
    contrastRatio(palette.ink, background) >= contrastRatio(white, background) ? palette.ink : white;
  const accent = [palette.highlight, palette.accent, palette.background].find(
    (color) => color !== background && contrastRatio(color, background) >= textRatio,
  );

  return { background, ink, accent: accent ?? ink };
}

function isNearWhite(color: string): boolean {
  return (luminance(color) ?? 0) > 0.9;
}
