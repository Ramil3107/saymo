import type { CSSProperties, ReactNode } from "react";
import { exitMs, type MoveSpec, poseAt } from "../../motion/moves";
import type { Element } from "../../schema/video";
import { fractionDigits } from "../../type/numbers";
import type { TitleLine } from "../../type/schedule";
import { useMs } from "../motion/Move";
import { wholePx } from "../motion/pixels";
import type { StyleKit } from "../style/kit";
import type { Frame, PrimitiveProps } from "../theme";
import { CornerLabel } from "../type/CornerLabel";
import { Counter } from "../type/Counter";
import { KineticTitle, type TypeColors } from "../type/KineticTitle";
import { type Surface, typeScale } from "./surface";

type KineticKind = "title" | "counter" | "corner-label" | "headline" | "big-number";

type KineticProps<Kind extends KineticKind> = PrimitiveProps<Kind> & { surface: Surface };

type ElementOf<Kind extends Element["kind"]> = Extract<Element, { kind: Kind }>;

type BoxProps = { element: Element; kit: StyleKit; frame: Frame; surface: Surface; children: ReactNode };

const shortLineWords = 3;
const cornerFontShare = 0.5;
const scrimInset = "-14% -6%";

export function TitleElement({ element, theme, frame, surface }: KineticProps<"title">) {
  const { kit } = theme;
  const width = element.box.w * frame.width;

  return (
    <KineticBox element={element} kit={kit} frame={frame} surface={surface}>
      <KineticTitle
        {...kit}
        sizeScale={typeScale(surface)}
        colors={colorsOn(kit, surface)}
        font={kit.display}
        lines={element.lines.map((line) => cased(kit, line))}
        entrance={element.entrance}
        atMs={element.enterMs}
        exit={exitOf(element, kit)}
        width={width}
      />
    </KineticBox>
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
    <KineticBox element={element} kit={kit} frame={frame} surface={surface}>
      <Counter
        {...kit}
        sizeScale={typeScale(surface)}
        colors={colorsOn(kit, surface)}
        font={kit.display}
        to={element.value}
        from={0}
        decimals={element.decimals}
        prefix={element.prefix}
        suffix={element.suffix ? casedText(kit, element.suffix) : undefined}
        label={element.label}
        ghost={kit.style.flourishes.includes("ghost-numbers")}
        atMs={element.enterMs}
        exit={exitOf(element, kit)}
        width={element.box.w * frame.width}
      />
    </KineticBox>
  );
}

export function CornerElement({ element, theme, frame, surface }: KineticProps<"corner-label">) {
  const { kit } = theme;

  return (
    <KineticBox element={element} kit={kit} frame={frame} surface={surface}>
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
    </KineticBox>
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

export function parseNumber(
  value: string,
): { value: number; decimals: number; prefix?: string; suffix?: string } | null {
  const match = /^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;

  const number = Number.parseFloat((match[2] ?? "").replace(",", "."));
  if (!Number.isFinite(number)) return null;

  return {
    value: number,
    decimals: fractionDigits(match[2] ?? ""),
    prefix: match[1] || undefined,
    suffix: match[3]?.trim() || undefined,
  };
}

// Over footage a soft shade sits behind the text, so it reads on a bright or busy shot.
function KineticBox({ element, kit, frame, surface, children }: BoxProps) {
  return (
    <div style={boxStyle(element.box, frame)}>
      {surface === "footage" ? <Scrim element={element} kit={kit} /> : null}
      {children}
    </div>
  );
}

function Scrim({ element, kit }: { element: Element; kit: StyleKit }) {
  const spec: MoveSpec = {
    enter: "fade",
    atMs: element.enterMs,
    exit: { move: "fade", atMs: exitAtMs(element, kit) },
  };
  const pose = poseAt(useMs(), spec, kit.tempo);
  if (!pose) return null;

  return (
    <div style={{ position: "absolute", inset: scrimInset, background: kit.scrim, opacity: pose.opacity }} />
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
  return { move: kit.style.exit, atMs: exitAtMs(element, kit) };
}

function exitAtMs(element: { enterMs: number; exitMs: number }, kit: StyleKit): number {
  return Math.max(element.enterMs, element.exitMs - exitMs(kit.style.exit, kit.tempo));
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
