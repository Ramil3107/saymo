import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Destination } from "../../destinations";
import { captionBand } from "../../layout/safeZones";
import type { VideoDoc } from "../../schema/video";
import { frameToMs } from "../frames";
import { accentColor, ink, type Theme } from "../theme";

type CaptionsDoc = NonNullable<VideoDoc["captions"]>;

export function Captions({
  captions,
  theme,
  safeZone,
}: {
  captions: CaptionsDoc;
  theme: Theme;
  safeZone: Destination["safeZone"];
}) {
  const ms = frameToMs(useCurrentFrame());
  const { width, height } = useVideoConfig();
  const page = captions.pages.find(
    (p) => ms >= p.startMs && ms < p.startMs + p.durationMs,
  );
  if (!page) return null;
  const band = captionBand(safeZone);
  const fontSize = height * 0.034;
  const boxed = captions.style === "box";
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
        const style: React.CSSProperties = boxed
          ? {
              backgroundColor: active ? accentColor(theme) : "#FFFFFF",
              color: ink,
              padding: `0 ${fontSize * 0.3}px`,
              borderRadius: fontSize * 0.25,
            }
          : captions.style === "pop"
            ? {
                color: "#FFFFFF",
                transform: active ? "scale(1.15)" : "none",
                textShadow: `0 ${fontSize * 0.06}px ${fontSize * 0.3}px rgba(0,0,0,0.6)`,
              }
            : {
                color: active ? accentColor(theme) : "#FFFFFF",
                textShadow: `0 ${fontSize * 0.06}px ${fontSize * 0.3}px rgba(0,0,0,0.6)`,
              };
        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{ display: "inline-block", ...style }}
          >
            {token.text.trim()}
          </span>
        );
      })}
    </div>
  );
}
