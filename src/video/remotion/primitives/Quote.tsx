import { fitTextOnNLines } from "@remotion/layout-utils";
import type { Element } from "../../schema/video";
import { accentColor, type Frame, type Theme } from "../theme";
import { ElementBox } from "./ElementBox";

type QuoteElement = Extract<Element, { kind: "quote" }>;

export function Quote({
  element,
  theme,
  frame,
}: {
  element: QuoteElement;
  theme: Theme;
  frame: Frame;
}) {
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const bar = height * 0.08;
  const { fontSize } = fitTextOnNLines({
    text: element.text,
    maxLines: 3,
    maxBoxWidth: width - bar * 3,
    fontFamily: theme.fontFamily,
    fontWeight: 700,
    maxFontSize: element.author ? height * 0.26 : height * 0.3,
  });
  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{ alignItems: "stretch" }}
    >
      <div
        style={{
          width: bar,
          borderRadius: bar,
          backgroundColor: accentColor(theme),
          marginRight: bar * 2,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 700,
            lineHeight: 1.12,
            color: "#FFFFFF",
          }}
        >
          {element.text}
        </div>
        {element.author ? (
          <div
            style={{
              marginTop: fontSize * 0.4,
              fontSize: fontSize * 0.5,
              fontWeight: 500,
              color: "#FFFFFF",
              opacity: 0.8,
            }}
          >
            {element.author}
          </div>
        ) : null}
      </div>
    </ElementBox>
  );
}
