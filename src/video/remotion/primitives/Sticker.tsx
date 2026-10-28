import { fitText } from "@remotion/layout-utils";
import type { Element } from "../../schema/video";
import { type Frame, ink, type Theme } from "../theme";
import { ElementBox } from "./ElementBox";

type StickerElement = Extract<Element, { kind: "sticker" }>;

export function Sticker({
  element,
  theme,
  frame,
}: {
  element: StickerElement;
  theme: Theme;
  frame: Frame;
}) {
  const height = element.box.h * frame.height;
  const padding = height * 0.4;
  const text = element.text.toUpperCase();
  const { fontSize } = fitText({
    text,
    withinWidth: element.box.w * frame.width - padding * 2,
    fontFamily: theme.fontFamily,
    fontWeight: 800,
  });
  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{ justifyContent: "center" }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          color: ink,
          borderRadius: 999,
          padding: `0 ${padding}px`,
          height: height * 0.9,
          display: "flex",
          alignItems: "center",
          fontSize: Math.min(fontSize, height * 0.42),
          fontWeight: 800,
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          boxShadow: `0 0 0 ${height * 0.06}px ${ink}, 0 0 0 ${height * 0.12}px #FFFFFF`,
          transform: "rotate(-4deg)",
        }}
      >
        {text}
      </div>
    </ElementBox>
  );
}
