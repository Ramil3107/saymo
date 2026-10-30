import { fitTextOnNLines } from "@remotion/layout-utils";
import { interpolate, useCurrentFrame } from "remotion";
import { frameToMs } from "../frames";
import { accentColor, type PrimitiveProps, panelColor, white, withAlpha } from "../theme";
import { ElementBox } from "./ElementBox";

const labelShare = 0.018;
const titleShare = 0.058;
const maxLines = 2;
const labelDelayMs = 0;
const titleDelayMs = 140;
const lineInMs = 520;

export function TitleCard({ element, theme, frame }: PrimitiveProps<"title-card">) {
  const ms = frameToMs(useCurrentFrame()) - element.enterMs;
  const panel = panelColor(theme);
  const horizontal = Math.max(theme.safeZone.left, theme.safeZone.right) + 0.04;
  const width = frame.width * (1 - 2 * horizontal);
  const labelSize = frame.height * labelShare;

  const { fontSize } = fitTextOnNLines({
    text: element.text,
    maxLines,
    maxBoxWidth: width,
    fontFamily: theme.fontFamily,
    fontWeight: 900,
    maxFontSize: frame.height * titleShare,
  });

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(180deg, ${panel} 0%, ${panel} 72%, ${withAlpha(panel, 0)} 100%)`,
          paddingTop: frame.height * (theme.safeZone.top + 0.03),
          paddingLeft: frame.width * horizontal,
          paddingRight: frame.width * horizontal,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: labelSize * 0.9,
        }}
      >
        {element.sub ? (
          <div
            style={{
              fontSize: labelSize,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accentColor(theme),
              ...riseIn(ms, labelDelayMs),
            }}
          >
            {element.sub}
          </div>
        ) : null}
        <div style={{ overflow: "hidden", paddingBottom: fontSize * 0.1 }}>
          <div
            style={{
              fontSize,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: white,
              ...riseIn(ms, titleDelayMs),
            }}
          >
            {element.text}
          </div>
        </div>
      </div>
    </ElementBox>
  );
}

function riseIn(ms: number, delayMs: number) {
  const progress = interpolate(ms, [delayMs, delayMs + lineInMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - (1 - progress) ** 4;

  return { opacity: eased, transform: `translateY(${(1 - eased) * 105}%)` };
}
