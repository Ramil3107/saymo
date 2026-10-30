import type { CSSProperties } from "react";
import type { MoveSpec } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { Chevrons } from "../accents/Chevrons";
import { Move } from "../motion/Move";
import { TypeOn } from "../motion/TypeOn";
import type { TypeColors, TypeFont } from "./KineticTitle";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Props = {
  text: string;
  corner: Corner;
  chevrons?: boolean;
  atMs: number;
  exit?: MoveSpec["exit"];
  colors: TypeColors;
  font: TypeFont;
  tempo: Tempo;
  width: number;
};

const marginShare = 0.06;
const fontShare = 0.048;

export function CornerLabel({ text, corner, chevrons, atMs, exit, colors, font, tempo, width }: Props) {
  const fontSize = width * fontShare;
  const pointing = corner.endsWith("left") ? "left" : "right";

  return (
    <Move
      spec={{ enter: "cut", atMs, exit }}
      tempo={tempo}
      unitPx={width}
      style={{ position: "absolute", ...placement(corner, width * marginShare) }}
      innerStyle={{ gap: fontSize * 0.5, flexDirection: pointing === "left" ? "row" : "row-reverse" }}
    >
      <span
        style={{
          fontSize,
          fontFamily: font.family,
          fontWeight: font.weight,
          color: colors.ink,
          letterSpacing: "0.06em",
        }}
      >
        <TypeOn text={text.toUpperCase()} atMs={atMs} tempo={tempo} />
      </span>
      {chevrons ? <Chevrons tempo={tempo} color={colors.accent} size={fontSize} pointing={pointing} /> : null}
    </Move>
  );
}

function placement(corner: Corner, margin: number): CSSProperties {
  switch (corner) {
    case "top-left":
      return { top: margin, left: margin };
    case "top-right":
      return { top: margin, right: margin };
    case "bottom-left":
      return { bottom: margin, left: margin };
    case "bottom-right":
      return { bottom: margin, right: margin };
  }
}
