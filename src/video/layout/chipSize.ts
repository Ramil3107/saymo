import { type Format, formatSize } from "../destinations";
import { round6 } from "./geometry";
import { estimateTextWidth } from "./textWidth";

type Size = { w: number; h: number };

export const chipFontShare = 0.016;
export const chipLineHeight = 1.12;
export const chipMaxLines = 2;

const paddingShare = 0.7;
const verticalPaddingShare = 0.35;
const badgeShare = 1.5;
const badgeGapShare = 0.4;
const maxLineShare = 0.3;

// A chip is as wide as its text; long text wraps onto a second line. Sizes are frame fractions.
export function chipSize(text: string, badge: string | undefined, format: Format): Size {
  const { width, height } = formatSize(format);
  const fontPx = height * chipFontShare;
  const textPx = estimateTextWidth(text, fontPx);
  const maxLinePx = width * maxLineShare;
  const lines = Math.min(chipMaxLines, Math.ceil(textPx / maxLinePx));
  const linePx = lines > 1 ? maxLinePx : textPx;
  const badgePx = badge ? fontPx * (badgeShare + badgeGapShare) : 0;

  const widthPx = linePx + badgePx + fontPx * paddingShare * 2;
  const heightPx = fontPx * chipLineHeight * lines + fontPx * verticalPaddingShare * 2;

  return { w: round6(widthPx / width), h: round6(heightPx / height) };
}
