import { useCurrentFrame, useVideoConfig } from "remotion";
import type { SafeZone } from "../../destinations";
import { captionBand } from "../../layout/safeZones";
import type { CaptionPage, VideoDoc } from "../../schema/video";
import { frameToMs } from "../frames";
import type { Theme } from "../theme";
import { type CaptionStyle, captionGap, tokenStyle } from "./captionStyle";

type CaptionsDoc = Omit<NonNullable<VideoDoc["captions"]>, "style"> & { style: CaptionStyle };
type Props = { captions: CaptionsDoc; theme: Theme; safeZone: SafeZone };

const fontShare = 0.034;

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
        gap: captionGap(captions.style, fontSize),
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
