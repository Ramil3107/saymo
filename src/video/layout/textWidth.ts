import { type Format, formatSize } from "../destinations";
import type { Box } from "../schema/content";

const latinShare = 0.58;
const cyrillicShare = 0.64;
const spaceShare = 0.3;
const lineHeight = 1.2;

export function estimateTextWidth(text: string, fontSizePx: number): number {
  let shares = 0;
  for (const char of text) shares += charShare(char);

  return shares * fontSizePx;
}

export function fitsInBox(
  text: string,
  box: Box,
  format: Format,
  maxLines: number,
  fontSizePx: number,
): boolean {
  const { width, height } = formatSize(format);
  const lines = Math.ceil(estimateTextWidth(text, fontSizePx) / (box.w * width));

  return lines <= maxLines && lines * fontSizePx * lineHeight <= box.h * height;
}

function charShare(char: string): number {
  if (char === " ") return spaceShare;
  if (/[Ѐ-ӿ]/.test(char)) return cyrillicShare;
  return latinShare;
}
