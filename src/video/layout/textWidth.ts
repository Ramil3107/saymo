import { type Format, formatSize } from "../destinations";
import type { Box } from "../schema/content";

const latinShare = 0.58;
const cyrillicShare = 0.64;
const spaceShare = 0.3;
const lineHeight = 1.2;

export function estimateTextWidth(text: string, fontSizePx: number): number {
  let width = 0;
  for (const char of text) {
    if (char === " ") width += spaceShare;
    else if (/[Ѐ-ӿ]/.test(char)) width += cyrillicShare;
    else width += latinShare;
  }
  return width * fontSizePx;
}

export function fitsInBox(
  text: string,
  box: Box,
  format: Format,
  maxLines: number,
  fontSizePx: number,
): boolean {
  const { width, height } = formatSize(format);
  const lines = Math.ceil(
    estimateTextWidth(text, fontSizePx) / (box.w * width),
  );
  return lines <= maxLines && lines * fontSizePx * lineHeight <= box.h * height;
}
