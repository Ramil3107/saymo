import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { SafeZone } from "../../destinations";
import { captionBand } from "../../layout/safeZones";
import type { CaptionPage, VideoDoc } from "../../schema/video";
import { frameToMs } from "../frames";
import { accentColor, ink, type Theme, white } from "../theme";

type CaptionsDoc = NonNullable<VideoDoc["captions"]>;
type CaptionStyle = CaptionsDoc["style"];
type Props = { captions: CaptionsDoc; theme: Theme; safeZone: SafeZone };

const fontShare = 0.034;
const popScale = 1.15;

export function Captions({ captions, theme, safeZone }: Props) {
  const ms = frameToMs(useCurrentFrame());
  const { width, height } = useVideoConfig();

  const page = captions.pages.find((candidate) => isShowing(candidate, ms));
  if (!page) return null;

  const band = captionBand(safeZone);
  const fontSize = height * fontShare;

  return (
    <div
      data-element-id="captions"
      style={{
        position: "absolute",
        left: band.x * width,
        width: band.w * width,
        bottom: (1 - band.y - band.h) * height,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: fontSize * 0.25,
        fontSize,
        fontWeight: 800,
        lineHeight: 1.25,
        textAlign: "center",
      }}
    >
      {page.tokens.map((token) => {
        const active = ms >= token.fromMs && ms < token.toMs;
        const style = tokenStyle(captions.style, active, theme, fontSize);

        return (
          <span key={`${token.fromMs}-${token.text}`} style={{ display: "inline-block", ...style }}>
            {token.text.trim()}
          </span>
        );
      })}
    </div>
  );
}

function isShowing(page: CaptionPage, ms: number): boolean {
  return ms >= page.startMs && ms < page.startMs + page.durationMs;
}

function tokenStyle(style: CaptionStyle, active: boolean, theme: Theme, fontSize: number): CSSProperties {
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
