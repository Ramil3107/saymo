import { chipFontShare, chipLineHeight, chipMaxLines } from "../../layout/chipSize";
import { navy, type PrimitiveProps, paper, white } from "../theme";
import { ElementBox } from "./ElementBox";

const fontWeight = 700;
const badgeShare = 1.5;
const badgeGapShare = 0.4;
const paddingShare = 0.7;

export function Chip({ element, theme, frame }: PrimitiveProps<"chip">) {
  const fontSize = frame.height * chipFontShare;
  const multiline = element.box.h * frame.height > fontSize * chipLineHeight * 1.5;

  return (
    <ElementBox element={element} theme={theme} frame={frame} preset="pop">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: fontSize * badgeGapShare,
          width: "100%",
          height: "100%",
          padding: `0 ${fontSize * paddingShare}px 0 ${element.badge ? fontSize * 0.35 : fontSize * paddingShare}px`,
          backgroundColor: paper,
          color: navy,
          borderRadius: multiline ? fontSize * 0.9 : 999,
          boxShadow: "0 14px 34px rgba(8, 24, 70, 0.28), 0 0 0 1px rgba(18, 48, 110, 0.06)",
          fontSize,
          fontWeight,
          lineHeight: chipLineHeight,
          whiteSpace: multiline ? "normal" : "nowrap",
        }}
      >
        {element.badge ? (
          <Badge text={element.badge} fontSize={fontSize} color={theme.brand.colors[0] ?? navy} />
        ) : null}
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: chipMaxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {element.text}
        </div>
      </div>
    </ElementBox>
  );
}

function Badge({ text, fontSize, color }: { text: string; fontSize: number; color: string }) {
  const size = fontSize * badgeShare;

  return (
    <div
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        color: white,
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
