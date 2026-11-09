import type { FieldTone } from "../layout/compositions";
import type { Tones } from "../styles";
import { contrastRatio, luminance, mixHex, readableOn } from "./color";

export type Palette = Tones & { accent: string; alt: string };

// marker: the bar swept under a marked line, a palette color the text reads on, or none when no color does.
export type FieldColors = { background: string; ink: string; accent: string; marker?: string };

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

// Text on a color field: ink or white, whichever reads better, the first palette color that reads on the field,
// and for a marker the first one that both reads under, since a marked line may be set in either.
export function fieldColors(palette: Palette, tone: FieldTone): FieldColors {
  const background = palette[tone];
  const ink =
    contrastRatio(palette.ink, background) >= contrastRatio(white, background) ? palette.ink : white;
  const accent =
    [palette.highlight, palette.accent, palette.background].find(
      (color) => color !== background && contrastRatio(color, background) >= textRatio,
    ) ?? ink;
  const marker = [palette.highlight, palette.accent, palette.alt].find(
    (color) =>
      color !== background &&
      contrastRatio(ink, color) >= textRatio &&
      contrastRatio(accent, color) >= textRatio,
  );

  return { background, ink, accent, marker };
}

function isNearWhite(color: string): boolean {
  return (luminance(color) ?? 0) > 0.9;
}
