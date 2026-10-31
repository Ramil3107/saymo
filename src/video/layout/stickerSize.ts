import { type Format, formatSize } from "../destinations";
import type { LabelFace } from "./chipSize";
import { round6 } from "./geometry";
import { estimateTextWidth } from "./textWidth";

type Size = { w: number; h: number };

export const stickerHeightShare = 0.08;
export const stickerFontShare = 0.42;
export const stickerPaddingShare = 0.4;

const minWidthShare = 0.2;
const maxWidthShare = 0.7;

// A sticker is as wide as its text at the sticker's size in the style's face, up to most of the frame.
export function stickerSize(text: string, format: Format, face: LabelFace): Size {
  const { width, height } = formatSize(format);
  const heightPx = height * stickerHeightShare;
  const fontPx = heightPx * stickerFontShare * face.labelScale;
  const widthPx = estimateTextWidth(text, fontPx) * face.widthScale + heightPx * stickerPaddingShare * 2;
  const share = Math.min(maxWidthShare, Math.max(minWidthShare, widthPx / width));

  return { w: round6(share), h: stickerHeightShare };
}
