import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { isKeyword } from "../../captions/rail";
import type { SafeZone } from "../../destinations";
import { captionBand } from "../../layout/safeZones";
import type { CaptionPage, VideoDoc } from "../../schema/video";
import { frameToMs } from "../frames";
import { accentColor, type Theme, textShadow, white } from "../theme";

type CaptionsDoc = NonNullable<VideoDoc["captions"]>;
type Props = { captions: CaptionsDoc; theme: Theme; safeZone: SafeZone };

const fontShare = 0.03;
const pageInMs = 140;
const wordInMs = 220;
const riseFromPx = 14;
const scaleFrom = 1.06;
const dimOpacity = 0.42;
const scrimTopShare = 0.56;

export function CaptionRail({ captions, theme, safeZone }: Props) {
  const ms = frameToMs(useCurrentFrame());
  const { width, height } = useVideoConfig();
  const page = captions.pages.find((candidate) => isShowing(candidate, ms));
  const band = captionBand(safeZone);
  const fontSize = height * fontShare;

  return (
    <>
      <div style={scrimStyle(height)} />
      {page ? (
        <div
          data-element-id="captions"
          style={{
            position: "absolute",
            left: band.x * width,
            width: band.w * width,
            bottom: (1 - band.y - band.h) * height,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignContent: "flex-end",
            columnGap: fontSize * 0.3,
            rowGap: 2,
            fontSize,
            fontWeight: 800,
            lineHeight: 1.12,
            textAlign: "center",
            ...pageEntrance(page, ms),
          }}
        >
          {page.tokens.map((token) => (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={wordStyle(token, ms, captions.keywords, theme, fontSize)}
            >
              {token.text}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

function isShowing(page: CaptionPage, ms: number): boolean {
  return ms >= page.startMs && ms < page.startMs + page.durationMs;
}

function pageEntrance(page: CaptionPage, ms: number): CSSProperties {
  const progress = reveal(ms, page.startMs, pageInMs);
  return { opacity: progress, transform: `translateY(${(1 - progress) * riseFromPx}px)` };
}

function wordStyle(
  token: CaptionPage["tokens"][number],
  ms: number,
  keywords: string[],
  theme: Theme,
  fontSize: number,
): CSSProperties {
  const progress = reveal(ms, token.fromMs, wordInMs);
  const revealed = ms >= token.fromMs;
  const color = revealed && isKeyword(token.text, keywords) ? accentColor(theme) : white;

  return {
    display: "inline-block",
    color,
    opacity: dimOpacity + (1 - dimOpacity) * progress,
    transform: `scale(${scaleFrom - (scaleFrom - 1) * progress})`,
    textShadow: textShadow(fontSize),
  };
}

function reveal(ms: number, fromMs: number, durationMs: number): number {
  return interpolate(ms, [fromMs, fromMs + durationMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function scrimStyle(height: number): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    top: height * scrimTopShare,
    bottom: 0,
    background:
      "linear-gradient(to bottom, rgba(4,10,28,0) 0%, rgba(4,10,28,0.38) 45%, rgba(4,10,28,0.55) 100%)",
  };
}
