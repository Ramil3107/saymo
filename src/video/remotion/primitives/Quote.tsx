import { fitTextOnNLines } from "@remotion/layout-utils";
import type { CSSProperties } from "react";
import type { StyleKit } from "../style/kit";
import type { PrimitiveProps } from "../theme";
import type { TypeColors } from "../type/KineticTitle";
import { ElementBox } from "./ElementBox";
import type { Surface } from "./Kinetic";

const maxLines = 3;
const barShare = 0.08;
const textShare = 0.3;
const textShareWithAuthor = 0.26;

type QuoteElement = PrimitiveProps<"quote">["element"];

export function Quote({ element, theme, frame, surface }: PrimitiveProps<"quote"> & { surface: Surface }) {
  const { kit } = theme;
  const colors = surface === "footage" ? kit.onFootage : kit.colors;
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const bar = height * barShare;
  const fontSize = fittedQuoteSize(kit, element, width - bar * 3, height);

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div style={{ width: bar, borderRadius: bar, backgroundColor: colors.accent, marginRight: bar * 2 }} />
      <div style={columnStyle(colors)}>
        <div style={textStyle(kit, colors, fontSize)}>{element.text}</div>
        {element.author ? <div style={authorStyle(colors, fontSize)}>{element.author}</div> : null}
      </div>
    </ElementBox>
  );
}

function fittedQuoteSize(kit: StyleKit, element: QuoteElement, maxBoxWidth: number, height: number): number {
  const { fontSize } = fitTextOnNLines({
    text: element.text,
    maxLines,
    maxBoxWidth,
    fontFamily: kit.display.family,
    fontWeight: kit.display.weight,
    maxFontSize: height * (element.author ? textShareWithAuthor : textShare),
  });

  return fontSize;
}

function columnStyle(colors: TypeColors): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textShadow: colors.shadow,
  };
}

function textStyle(kit: StyleKit, colors: TypeColors, fontSize: number): CSSProperties {
  return {
    fontFamily: kit.display.family,
    fontSize,
    fontWeight: kit.display.weight,
    lineHeight: 1.12,
    color: colors.ink,
  };
}

function authorStyle(colors: TypeColors, fontSize: number): CSSProperties {
  return {
    marginTop: fontSize * 0.4,
    fontSize: fontSize * 0.5,
    fontWeight: 600,
    color: colors.accent,
  };
}
