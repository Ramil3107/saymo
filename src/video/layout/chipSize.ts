import { type Format, formatSize } from "../destinations";
import { round6 } from "./geometry";
import { estimateTextWidth } from "./textWidth";

type Size = { w: number; h: number };

// A display face as labels see it: labelScale sizes the text, widthScale is its width over the estimate.
export type LabelFace = { labelScale: number; widthScale: number };

export const chipFontShare = 0.021;
export const chipLineHeight = 1.12;
export const chipMaxLines = 2;

const paddingShare = 0.7;
const verticalPaddingShare = 0.35;
const badgeShare = 1.5;
const badgeGapShare = 0.4;
const maxLineShare = 0.3;
const wrapSlack = 1.2;

// A chip is as wide as its text in the style's face; long text wraps onto a second line. Sizes are frame fractions.
export function chipSize(text: string, badge: string | undefined, format: Format, face: LabelFace): Size {
  const { width, height } = formatSize(format);
  const fontPx = height * chipFontShare * face.labelScale;
  const widthOf = (part: string) => estimateTextWidth(part, fontPx) * face.widthScale;
  const textPx = widthOf(text);
  const linePx = lineWidth(textPx, text.split(/\s+/).map(widthOf), width * maxLineShare);
  const lines = textPx > linePx ? chipMaxLines : 1;
  const badgePx = badge ? fontPx * (badgeShare + badgeGapShare) : 0;

  const widthPx = Math.min(textPx, linePx) + badgePx + fontPx * paddingShare * 2;
  const heightPx = fontPx * chipLineHeight * lines + fontPx * verticalPaddingShare * 2;

  return { w: round6(widthPx / width), h: round6(heightPx / height) };
}

// A line never breaks a word, and two lines always hold the text, with slack for uneven breaks.
function lineWidth(textPx: number, wordsPx: number[], maxLinePx: number): number {
  return Math.max(maxLinePx, ...wordsPx, (textPx / chipMaxLines) * wrapSlack);
}

export function chipLines(heightPx: number, fontPx: number): number {
  return Math.max(1, Math.round((heightPx - fontPx * verticalPaddingShare * 2) / (fontPx * chipLineHeight)));
}
