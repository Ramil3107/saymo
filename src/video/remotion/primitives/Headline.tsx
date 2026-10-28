import { fitTextOnNLines } from "@remotion/layout-utils";
import type { Element } from "../../schema/video";
import type { Frame, Theme } from "../theme";
import { ElementBox } from "./ElementBox";

type HeadlineElement = Extract<Element, { kind: "headline" }>;

export function Headline({
  element,
  theme,
  frame,
}: {
  element: HeadlineElement;
  theme: Theme;
  frame: Frame;
}) {
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const fontWeight = theme.register.fontWeight[1];
  const { fontSize } = fitTextOnNLines({
    text: element.text,
    maxLines: 2,
    maxBoxWidth: width,
    fontFamily: theme.fontFamily,
    fontWeight,
    maxFontSize: element.sub ? height * 0.36 : height * 0.46,
  });
  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight,
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          color: "#FFFFFF",
        }}
      >
        {element.text}
      </div>
      {element.sub ? (
        <div
          style={{
            marginTop: fontSize * 0.3,
            fontSize: fontSize * 0.42,
            fontWeight: 500,
            color: "#FFFFFF",
            opacity: 0.85,
          }}
        >
          {element.sub}
        </div>
      ) : null}
    </ElementBox>
  );
}
