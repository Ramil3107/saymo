import { fitText } from "@remotion/layout-utils";
import type { Element } from "../../schema/video";
import { accentColor, type Frame, ink, type Theme } from "../theme";
import { ElementBox } from "./ElementBox";

type ChipElement = Extract<Element, { kind: "chip" }>;

export function Chip({
  element,
  theme,
  frame,
}: {
  element: ChipElement;
  theme: Theme;
  frame: Frame;
}) {
  const height = element.box.h * frame.height;
  const padding = height * 0.35;
  const { fontSize } = fitText({
    text: element.text,
    withinWidth: element.box.w * frame.width - padding * 2,
    fontFamily: theme.fontFamily,
    fontWeight: 700,
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
          fontSize: Math.min(fontSize, height * 0.5),
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {element.text}
      </div>
    </ElementBox>
  );
}
