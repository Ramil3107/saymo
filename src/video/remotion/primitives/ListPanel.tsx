import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { frameToMs } from "../frames";
import type { StyleKit } from "../style/kit";
import type { Frame, PrimitiveProps, Theme } from "../theme";
import { ElementBox } from "./ElementBox";
import { fadedPanel } from "./panelStyle";

const titleShare = 0.024;
const itemShare = 0.02;
const numberShare = 0.014;
const titleDelayMs = 0;
const itemDelayMs = 260;
const itemStaggerMs = 180;
const itemInMs = 420;

type ItemProps = { item: string; index: number; ms: number; frame: Frame; accent: string };

export function ListPanel({ element, theme, frame }: PrimitiveProps<"list">) {
  const ms = frameToMs(useCurrentFrame()) - element.enterMs;
  const { kit } = theme;
  const onLeft = element.box.x < 0.5;
  const itemSize = frame.height * itemShare;

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div style={sheetStyle(theme, frame, onLeft, itemSize)}>
        <div style={titleStyle(kit, frame.height * titleShare, itemSize, ms)}>{element.text}</div>
        {element.items.map((item, index) => (
          <ListItem key={item} item={item} index={index} ms={ms} frame={frame} accent={kit.panel.accent} />
        ))}
      </div>
    </ElementBox>
  );
}

function sheetStyle(theme: Theme, frame: Frame, onLeft: boolean, itemSize: number): CSSProperties {
  const { kit, safeZone } = theme;
  const direction = onLeft ? "90deg" : "270deg";
  const inset = frame.width * 0.05;

  return {
    width: "100%",
    height: "100%",
    background: fadedPanel(kit.panel.background, direction, 78),
    paddingTop: frame.height * (safeZone.top + 0.06),
    paddingLeft: onLeft ? frame.width * safeZone.left + inset : inset,
    paddingRight: onLeft ? inset * 1.6 : frame.width * safeZone.right + inset,
    display: "flex",
    flexDirection: "column",
    gap: itemSize * 0.9,
    color: kit.panel.text,
    fontFamily: kit.textFamily,
  };
}

function titleStyle(kit: StyleKit, fontSize: number, itemSize: number, ms: number): CSSProperties {
  return {
    fontSize,
    fontFamily: kit.display.family,
    fontWeight: kit.display.weight,
    lineHeight: 1.1,
    letterSpacing: "0.04em",
    textTransform: kit.style.display.upper ? "uppercase" : undefined,
    marginBottom: itemSize * 0.5,
    ...slideIn(ms, titleDelayMs),
  };
}

function ListItem({ item, index, ms, frame, accent }: ItemProps) {
  const itemSize = frame.height * itemShare;

  return (
    <div style={rowStyle(itemSize, ms, index)}>
      <div style={numberStyle(frame, accent)}>{String(index + 1).padStart(2, "0")}</div>
      <div style={{ fontSize: itemSize, fontWeight: 600, lineHeight: 1.2 }}>{item}</div>
    </div>
  );
}

function rowStyle(itemSize: number, ms: number, index: number): CSSProperties {
  return {
    display: "flex",
    gap: itemSize * 0.7,
    alignItems: "baseline",
    ...slideIn(ms, itemDelayMs + index * itemStaggerMs),
  };
}

function numberStyle(frame: Frame, accent: string): CSSProperties {
  return {
    flex: "none",
    fontSize: frame.height * numberShare,
    fontWeight: 800,
    color: accent,
    letterSpacing: "0.08em",
  };
}

function slideIn(ms: number, delayMs: number) {
  const progress = interpolate(ms, [delayMs, delayMs + itemInMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - (1 - progress) ** 3;

  return { opacity: eased, transform: `translateX(${(1 - eased) * -24}px)` };
}
