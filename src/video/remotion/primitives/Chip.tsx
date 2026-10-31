import type { CSSProperties } from "react";
import { chipFontShare, chipLineHeight, chipLines, chipMaxLines } from "../../layout/chipSize";
import type { StyleKit } from "../style/kit";
import type { PrimitiveProps } from "../theme";
import { ElementBox } from "./ElementBox";
import { fittedSize, labelBox, labelText } from "./labelStyle";

const badgeShare = 1.5;
const badgeGapShare = 0.4;
const paddingShare = 0.7;

export function Chip({ element, theme, frame }: PrimitiveProps<"chip">) {
  const { kit } = theme;
  const baseSize = frame.height * chipFontShare;
  const multiline = chipLines(element.box.h * frame.height, baseSize) > 1;
  const text = labelText(kit, element.text);
  const badgeRoom = element.badge ? baseSize * (badgeShare + badgeGapShare) : 0;
  const fontSize = multiline
    ? baseSize
    : fittedSize(kit, text, baseSize, element.box.w * frame.width - badgeRoom - baseSize * paddingShare * 2);

  return (
    <ElementBox element={element} theme={theme} frame={frame} preset="pop">
      <div style={chipStyle(kit, fontSize, multiline, Boolean(element.badge))}>
        {element.badge ? <Badge text={element.badge} fontSize={fontSize} kit={kit} /> : null}
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: chipMaxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {text}
        </div>
      </div>
    </ElementBox>
  );
}

function chipStyle(kit: StyleKit, fontSize: number, multiline: boolean, badged: boolean): CSSProperties {
  return {
    ...labelBox(kit, fontSize, multiline),
    display: "flex",
    alignItems: "center",
    gap: fontSize * badgeGapShare,
    width: "100%",
    height: "100%",
    padding: `0 ${fontSize * paddingShare}px 0 ${badged ? fontSize * 0.35 : fontSize * paddingShare}px`,
    fontSize,
    lineHeight: chipLineHeight,
    whiteSpace: multiline ? "normal" : "nowrap",
  };
}

function Badge({ text, fontSize, kit }: { text: string; fontSize: number; kit: StyleKit }) {
  const size = fontSize * badgeShare;

  return (
    <div
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: kit.label.shape === "pill" ? "50%" : size * 0.18,
        backgroundColor: kit.label.badge,
        color: kit.label.badgeText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: text.length > 2 ? fontSize * 0.5 : fontSize * 0.62,
        letterSpacing: "-0.02em",
      }}
    >
      {text}
    </div>
  );
}
