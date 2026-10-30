import { interpolate, useCurrentFrame } from "remotion";
import { frameToMs } from "../frames";
import { accentColor, type PrimitiveProps, panelColor, white, withAlpha } from "../theme";
import { ElementBox } from "./ElementBox";

const titleShare = 0.024;
const itemShare = 0.02;
const numberShare = 0.014;
const titleDelayMs = 0;
const itemDelayMs = 260;
const itemStaggerMs = 180;
const itemInMs = 420;

export function ListPanel({ element, theme, frame }: PrimitiveProps<"list">) {
  const ms = frameToMs(useCurrentFrame()) - element.enterMs;
  const panel = panelColor(theme);
  const onLeft = element.box.x < 0.5;
  const direction = onLeft ? "90deg" : "270deg";
  const inset = frame.width * 0.05;
  const titleSize = frame.height * titleShare;
  const itemSize = frame.height * itemShare;

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(${direction}, ${panel} 0%, ${panel} 78%, ${withAlpha(panel, 0)} 100%)`,
          paddingTop: frame.height * (theme.safeZone.top + 0.06),
          paddingLeft: onLeft ? frame.width * theme.safeZone.left + inset : inset,
          paddingRight: onLeft ? inset * 1.6 : frame.width * theme.safeZone.right + inset,
          display: "flex",
          flexDirection: "column",
          gap: itemSize * 0.9,
          color: white,
        }}
      >
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: itemSize * 0.5,
            ...slideIn(ms, titleDelayMs),
          }}
        >
          {element.text}
        </div>
        {element.items.map((item, index) => (
          <div
            key={item}
            style={{
              display: "flex",
              gap: itemSize * 0.7,
              alignItems: "baseline",
              ...slideIn(ms, itemDelayMs + index * itemStaggerMs),
            }}
          >
            <div
              style={{
                flex: "none",
                fontSize: frame.height * numberShare,
                fontWeight: 800,
                color: accentColor(theme),
                letterSpacing: "0.08em",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: itemSize, fontWeight: 600, lineHeight: 1.2 }}>{item}</div>
          </div>
        ))}
      </div>
    </ElementBox>
  );
}

function slideIn(ms: number, delayMs: number) {
  const progress = interpolate(ms, [delayMs, delayMs + itemInMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - (1 - progress) ** 3;

  return { opacity: eased, transform: `translateX(${(1 - eased) * -24}px)` };
}
