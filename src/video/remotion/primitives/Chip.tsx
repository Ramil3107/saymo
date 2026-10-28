import { fitText } from "@remotion/layout-utils";
import { accentColor, ink, type PrimitiveProps } from "../theme";
import { ElementBox } from "./ElementBox";

const fontWeight = 700;
const paddingShare = 0.35;
const maxFontShare = 0.5;

export function Chip({ element, theme, frame }: PrimitiveProps<"chip">) {
  const height = element.box.h * frame.height;
  const padding = height * paddingShare;

  const { fontSize } = fitText({
    text: element.text,
    withinWidth: element.box.w * frame.width - padding * 2,
    fontFamily: theme.fontFamily,
    fontWeight,
  });

  return (
    <ElementBox element={element} theme={theme} frame={frame}>
      <div
        style={{
          backgroundColor: accentColor(theme),
          color: ink,
          borderRadius: 999,
          padding: `0 ${padding}px`,
          height,
          display: "flex",
          alignItems: "center",
          fontSize: Math.min(fontSize, height * maxFontShare),
          fontWeight,
          whiteSpace: "nowrap",
        }}
      >
        {element.text}
      </div>
    </ElementBox>
  );
}
