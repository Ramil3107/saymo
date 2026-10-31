import type { CSSProperties } from "react";
import type { StyleKit } from "../style/kit";
import type { PrimitiveProps } from "../theme";
import { ElementBox } from "./ElementBox";
import { fittedSize, labelBox, labelText } from "./labelStyle";

const paddingShare = 0.4;
const pillShare = 0.9;
const maxFontShare = 0.42;
const tiltDegrees = -4;

export function Sticker({ element, theme, frame }: PrimitiveProps<"sticker">) {
  const { kit } = theme;
  const height = element.box.h * frame.height;
  const padding = height * paddingShare;
  const text = labelText(kit, element.text);
  const fontSize = fittedSize(kit, text, height * maxFontShare, element.box.w * frame.width - padding * 2);

  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      preset="pop"
      style={{ justifyContent: "center" }}
    >
      <div data-anchor style={stickerStyle(kit, fontSize, padding, height)}>
        {text}
      </div>
    </ElementBox>
  );
}

function stickerStyle(kit: StyleKit, fontSize: number, padding: number, height: number): CSSProperties {
  const pill = kit.label.shape === "pill";

  return {
    ...labelBox(kit, fontSize, false),
    backgroundColor: pill ? kit.palette.accent : kit.label.background,
    color: pill ? kit.palette.surface : kit.label.text,
    padding: `0 ${padding}px`,
    height: height * pillShare,
    display: "flex",
    alignItems: "center",
    fontSize,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    transform: `rotate(${tiltDegrees}deg)`,
  };
}
