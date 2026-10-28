import { fitText } from "@remotion/layout-utils";
import { ink, type PrimitiveProps, white } from "../theme";
import { ElementBox } from "./ElementBox";

const fontWeight = 800;
const paddingShare = 0.4;
const pillShare = 0.9;
const maxFontShare = 0.42;
const tiltDegrees = -4;

export function Sticker({ element, theme, frame }: PrimitiveProps<"sticker">) {
  const height = element.box.h * frame.height;
  const padding = height * paddingShare;
  const text = element.text.toUpperCase();

  const { fontSize } = fitText({
    text,
    withinWidth: element.box.w * frame.width - padding * 2,
    fontFamily: theme.fontFamily,
    fontWeight,
  });

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ justifyContent: "center" }}>
      <div
        style={{
          backgroundColor: white,
          color: ink,
          borderRadius: 999,
          padding: `0 ${padding}px`,
          height: height * pillShare,
          display: "flex",
          alignItems: "center",
          fontSize: Math.min(fontSize, height * maxFontShare),
          fontWeight,
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          boxShadow: `0 0 0 ${height * 0.06}px ${ink}, 0 0 0 ${height * 0.12}px ${white}`,
          transform: `rotate(${tiltDegrees}deg)`,
        }}
      >
        {text}
      </div>
    </ElementBox>
  );
}
