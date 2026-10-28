import { fitText } from "@remotion/layout-utils";
import type { Element } from "../../schema/video";
import { accentColor, type Frame, ink, type Theme } from "../theme";
import { ElementBox } from "./ElementBox";

type LowerThirdElement = Extract<Element, { kind: "lower-third" }>;

export function LowerThird({
  element,
  theme,
  frame,
}: {
  element: LowerThirdElement;
  theme: Theme;
  frame: Frame;
}) {
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const padding = height * 0.25;
  const { fontSize } = fitText({
    text: element.name,
    withinWidth: width - padding * 2,
    fontFamily: theme.fontFamily,
    fontWeight: 800,
  });
  const nameSize = Math.min(fontSize, height * (element.role ? 0.5 : 0.56));
  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          backgroundColor: accentColor(theme),
          color: ink,
          borderRadius: height * 0.18,
          padding: `${padding * 0.4}px ${padding}px`,
          fontSize: nameSize,
          fontWeight: 800,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {element.name}
      </div>
      {element.role ? (
        <div
          style={{
            marginTop: padding * 0.3,
            backgroundColor: "#FFFFFF",
            color: ink,
            borderRadius: height * 0.14,
            padding: `${padding * 0.25}px ${padding * 0.8}px`,
            fontSize: nameSize * 0.6,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {element.role}
        </div>
      ) : null}
    </ElementBox>
  );
}
