import type { CSSProperties } from "react";
import { exitMs, type MoveSpec } from "../../motion/moves";
import type { TitleLine } from "../../type/schedule";
import { wholePx } from "../motion/pixels";
import type { StyleKit } from "../style/kit";
import type { Frame, PrimitiveProps } from "../theme";
import { CornerLabel } from "../type/CornerLabel";
import { Counter } from "../type/Counter";
import { KineticTitle, type TypeColors } from "../type/KineticTitle";

export type Surface = "footage" | "backdrop";

type KineticProps<Kind extends "title" | "counter" | "corner-label"> = PrimitiveProps<Kind> & {
  surface: Surface;
};

export function TitleElement({ element, theme, frame, surface }: KineticProps<"title">) {
  const { kit } = theme;
  const width = element.box.w * frame.width;

  return (
    <div style={boxStyle(element.box, frame)}>
      <KineticTitle
        {...kit}
        colors={colorsOn(kit, surface)}
        font={kit.display}
        lines={element.lines.map((line) => cased(kit, line))}
        entrance={element.entrance}
        atMs={element.enterMs}
        exit={exitOf(element, kit)}
        width={width}
      />
    </div>
  );
}

export function CounterElement({ element, theme, frame, surface }: KineticProps<"counter">) {
  const { kit } = theme;

  return (
    <div style={boxStyle(element.box, frame)}>
      <Counter
        {...kit}
        colors={colorsOn(kit, surface)}
        font={kit.display}
        to={element.value}
        from={0}
        prefix={element.prefix}
        suffix={element.suffix ? casedText(kit, element.suffix) : undefined}
        label={element.label}
        ghost={kit.style.accents.includes("burst")}
        atMs={element.enterMs}
        exit={exitOf(element, kit)}
        width={element.box.w * frame.width}
      />
    </div>
  );
}

export function CornerElement({ element, theme, frame, surface }: KineticProps<"corner-label">) {
  const { kit } = theme;

  return (
    <div style={boxStyle(element.box, frame)}>
      <CornerLabel
        {...kit}
        colors={colorsOn(kit, surface)}
        font={kit.display}
        text={element.text}
        corner={element.box.x + element.box.w / 2 < 0.5 ? "top-left" : "top-right"}
        chevrons={kit.style.accents.includes("chevrons")}
        atMs={element.enterMs}
        exit={exitOf(element, kit)}
        width={element.box.w * frame.width}
      />
    </div>
  );
}

function boxStyle(box: { x: number; y: number; w: number; h: number }, frame: Frame): CSSProperties {
  return {
    position: "absolute",
    left: wholePx(box.x * frame.width),
    top: wholePx(box.y * frame.height),
    width: wholePx(box.w * frame.width),
    height: wholePx(box.h * frame.height),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function colorsOn(kit: StyleKit, surface: Surface): TypeColors {
  return surface === "footage" ? kit.onFootage : kit.colors;
}

function exitOf(element: { enterMs: number; exitMs: number }, kit: StyleKit): MoveSpec["exit"] {
  const move = kit.style.exit;
  return { move, atMs: Math.max(element.enterMs, element.exitMs - exitMs(move, kit.tempo)) };
}

function cased(kit: StyleKit, line: TitleLine): TitleLine {
  return { ...line, text: casedText(kit, line.text) };
}

function casedText(kit: StyleKit, text: string): string {
  return kit.style.display.upper ? text.toUpperCase() : text;
}
