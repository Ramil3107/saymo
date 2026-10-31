import type { CSSProperties } from "react";
import { exitMs, type MoveSpec } from "../../motion/moves";
import type { Element } from "../../schema/video";
import type { TitleLine } from "../../type/schedule";
import { wholePx } from "../motion/pixels";
import type { StyleKit } from "../style/kit";
import type { Frame, PrimitiveProps } from "../theme";
import { CornerLabel } from "../type/CornerLabel";
import { Counter } from "../type/Counter";
import { KineticTitle, type TypeColors } from "../type/KineticTitle";

export type Surface = "footage" | "backdrop";

type KineticKind = "title" | "counter" | "corner-label" | "headline" | "big-number";

type KineticProps<Kind extends KineticKind> = PrimitiveProps<Kind> & { surface: Surface };

type ElementOf<Kind extends Element["kind"]> = Extract<Element, { kind: Kind }>;

const shortLineWords = 3;
const cornerFontShare = 0.5;

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

export function HeadlineElement({ element, theme, frame, surface }: KineticProps<"headline">) {
  const title = headlineAsTitle(element, theme.kit);
  return <TitleElement element={title} theme={theme} frame={frame} surface={surface} />;
}

export function BigNumberElement({ element, theme, frame, surface }: KineticProps<"big-number">) {
  const shown = bigNumberAs(element);
  if (shown.kind === "headline")
    return <HeadlineElement element={shown} theme={theme} frame={frame} surface={surface} />;

  return <CounterElement element={shown} theme={theme} frame={frame} surface={surface} />;
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
        ghost={kit.style.flourishes.includes("ghost-numbers")}
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
        chevrons={kit.style.flourishes.includes("chevrons")}
        atMs={element.enterMs}
        exit={exitOf(element, kit)}
        width={element.box.w * frame.width}
        fontPx={element.box.h * frame.height * cornerFontShare}
        marginPx={0}
      />
    </div>
  );
}

// A headline is a title the director wrote as one sentence: the sentence is the main line and the sub an accent line.
export function headlineAsTitle(element: ElementOf<"headline">, kit: StyleKit): ElementOf<"title"> {
  const main: TitleLine = {
    text: element.text,
    size: wordCount(element.text) > shortLineWords ? "m" : "l",
    tone: "ink",
    align: "center",
  };
  const sub: TitleLine[] = element.sub
    ? [{ text: element.sub, size: "s", tone: "accent", align: "center" }]
    : [];

  return {
    ...element,
    kind: "title",
    lines: [main, ...sub],
    entrance: kit.style.titleEntrances[0] ?? "rise",
  };
}

// A big number counts up when its value starts with a number; otherwise it is set as a headline.
export function bigNumberAs(element: ElementOf<"big-number">): ElementOf<"counter"> | ElementOf<"headline"> {
  const number = parseNumber(element.value);
  if (!number) return { ...element, kind: "headline", text: element.value, sub: element.label };

  return { ...element, kind: "counter", ...number, label: element.label };
}

export function parseNumber(value: string): { value: number; prefix?: string; suffix?: string } | null {
  const match = /^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;

  const number = Number.parseFloat((match[2] ?? "").replace(",", "."));
  if (!Number.isFinite(number)) return null;

  return { value: number, prefix: match[1] || undefined, suffix: match[3]?.trim() || undefined };
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

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
