import { fitTextOnNLines } from "@remotion/layout-utils";
import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { frameToMs } from "../frames";
import type { StyleKit } from "../style/kit";
import type { Frame, PrimitiveProps, Theme } from "../theme";
import { ElementBox } from "./ElementBox";
import { fadedPanel } from "./panelStyle";

const labelShare = 0.018;
const titleShare = 0.058;
const maxLines = 2;
const labelDelayMs = 0;
const titleDelayMs = 140;
const lineInMs = 520;

type TitleCardElement = PrimitiveProps<"title-card">["element"];
type CardLayout = { horizontal: number; paddingTop: number; labelSize: number; titleSize: number };

export function TitleCard({ element, theme, frame }: PrimitiveProps<"title-card">) {
  const ms = frameToMs(useCurrentFrame()) - element.enterMs;
  const { kit } = theme;
  const layout = cardLayout(element, theme, frame);

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div style={cardStyle(kit, frame, layout)}>
        {element.sub ? <div style={labelStyle(kit, layout.labelSize, ms)}>{element.sub}</div> : null}
        <div style={{ overflow: "hidden", paddingBottom: layout.titleSize * 0.1 }}>
          <div style={titleStyle(kit, layout.titleSize, ms)}>{element.text}</div>
        </div>
      </div>
    </ElementBox>
  );
}

function cardLayout(element: TitleCardElement, theme: Theme, frame: Frame): CardLayout {
  const horizontal = Math.max(theme.safeZone.left, theme.safeZone.right) + 0.04;
  const width = frame.width * (1 - 2 * horizontal);
  const labelSize = frame.height * labelShare;

  const paddingTop = frame.height * (theme.safeZone.top + 0.03);
  const labelBlock = element.sub ? labelSize * 1.9 : 0;
  const available = element.box.h * frame.height - paddingTop - labelBlock;
  const maxFontSize = Math.min(frame.height * titleShare, available / (maxLines * 1.1));

  const titleSize = fittedTitleSize(theme.kit, element.text, width, maxFontSize);

  return { horizontal, paddingTop, labelSize, titleSize };
}

function fittedTitleSize(kit: StyleKit, text: string, maxBoxWidth: number, maxFontSize: number): number {
  const { fontSize } = fitTextOnNLines({
    text,
    maxLines,
    maxBoxWidth,
    fontFamily: kit.display.family,
    fontWeight: kit.display.weight,
    maxFontSize,
  });

  return fontSize;
}

function cardStyle(kit: StyleKit, frame: Frame, layout: CardLayout): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    background: fadedPanel(kit.panel.background, "180deg", 72),
    fontFamily: kit.display.family,
    paddingTop: layout.paddingTop,
    paddingLeft: frame.width * layout.horizontal,
    paddingRight: frame.width * layout.horizontal,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: layout.labelSize * 0.9,
  };
}

function labelStyle(kit: StyleKit, fontSize: number, ms: number): CSSProperties {
  return {
    fontSize,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: kit.panel.accent,
    ...riseIn(ms, labelDelayMs),
  };
}

function titleStyle(kit: StyleKit, fontSize: number, ms: number): CSSProperties {
  return {
    fontSize,
    fontWeight: kit.display.weight,
    lineHeight: 1.02,
    letterSpacing: "-0.01em",
    textTransform: kit.style.display.upper ? "uppercase" : undefined,
    color: kit.panel.text,
    ...riseIn(ms, titleDelayMs),
  };
}

function riseIn(ms: number, delayMs: number) {
  const progress = interpolate(ms, [delayMs, delayMs + lineInMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - (1 - progress) ** 4;

  return { opacity: eased, transform: `translateY(${(1 - eased) * 105}%)` };
}
