import type { CSSProperties } from "react";
import type { VideoDoc } from "../../schema/video";
import { accentColor, ink, type Theme, white } from "../theme";

export type CaptionStyle = Exclude<NonNullable<VideoDoc["captions"]>["style"], "rail">;

export const popScale = 1.08;

const plainGapShare = 0.25;
const popGapShare = 0.55;

// A scaled token keeps its layout box, so the pop gap must absorb the growth of a long word.
export function captionGap(style: CaptionStyle, fontSize: number): number {
  return fontSize * (style === "pop" ? popGapShare : plainGapShare);
}

export function tokenStyle(
  style: CaptionStyle,
  active: boolean,
  theme: Theme,
  fontSize: number,
): CSSProperties {
  const shadow = `0 ${fontSize * 0.06}px ${fontSize * 0.3}px rgba(0,0,0,0.6)`;

  switch (style) {
    case "box":
      return {
        backgroundColor: active ? accentColor(theme) : white,
        color: ink,
        padding: `0 ${fontSize * 0.3}px`,
        borderRadius: fontSize * 0.25,
      };
    case "pop":
      return { color: white, transform: active ? `scale(${popScale})` : "none", textShadow: shadow };
    case "karaoke":
      return { color: active ? accentColor(theme) : white, textShadow: shadow };
  }
}
