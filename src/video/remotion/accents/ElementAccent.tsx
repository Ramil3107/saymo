import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { enterMs, exitMs } from "../../motion/moves";
import { linear, smoothstep } from "../../motion/timeline";
import type { Accent } from "../../schema/plan";
import type { Element } from "../../schema/video";
import type { AccentMark } from "../../styles";
import { entranceEndMs } from "../../type/schedule";
import { useMs } from "../motion/Move";
import { bigNumberAs, headlineAsTitle } from "../primitives/Kinetic";
import type { Surface } from "../primitives/surface";
import type { StyleKit } from "../style/kit";
import type { Frame, Theme } from "../theme";
import { countDurationMs } from "../type/Counter";
import { Burst } from "./Burst";
import { CornerBrackets } from "./CornerBrackets";
import { FlashBlocks } from "./FlashBlocks";
import { GrowFrame } from "./GrowFrame";
import type { Point, Rect } from "./geometry";
import { Scribble } from "./Scribble";
import { SelectionBox } from "./SelectionBox";
import { Sparkles } from "./Sparkles";

type Props = {
  accent: Accent;
  element: Element;
  theme: Theme;
  frame: Frame;
  surface: Surface;
  children: ReactNode;
};
type Timing = { atMs: number; untilMs: number };
type MarkProps = { mark: AccentMark; rect: Rect; timing: Timing; kit: StyleKit; frame: Frame; color: string };
type TextMarkKind = Extract<AccentMark, "burst" | "sparkles" | "circle" | "underline">;
type BoxMarkKind = Exclude<AccentMark, TextMarkKind>;

const anchorSelector = "[data-anchor]";
const padShare = 0.18;
const maxPadShare = 0.025;
const strokeShare = 0.006;
const boldStroke = 1.5;
const handleShare = 0.014;
const sparkleShare = 0.45;
const sparkleRange = { min: 0.03, max: 0.08 };
const bracketArmShare = 0.3;
const markedBehind: AccentMark[] = ["flash-blocks"];

// The mark hugs the text the element shows, measured on the page, so it follows wrapping, fitted sizes and floating.
export function Accented({ accent, element, theme, frame, surface, children }: Props) {
  const { kit } = theme;
  const ms = useMs();
  const container = useRef<HTMLDivElement>(null);
  const timing = accentTiming(element, kit);
  const rect = useAnchorRect(container, ms >= timing.atMs && ms < timing.untilMs + kit.tempo.quickMs);
  const mark = kit.style.accents[accent];
  const color = surface === "footage" ? kit.palette.highlight : kit.palette.accent;
  const faded = smoothstep(linear(ms, timing.untilMs, kit.tempo.quickMs));

  const drawn = rect ? (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - faded }}>
      <Mark mark={mark} rect={rect} timing={timing} kit={kit} frame={frame} color={color} />
    </div>
  ) : null;
  const behind = markedBehind.includes(mark);

  return (
    <div ref={container} style={{ position: "absolute", inset: 0 }}>
      {behind ? drawn : null}
      {children}
      {behind ? null : drawn}
    </div>
  );
}

// An accent starts once its element has settled and fades as the element starts to leave.
function accentTiming(element: Element, kit: StyleKit): Timing {
  return {
    atMs: settledAtMs(element, kit),
    untilMs: element.exitMs - exitMs(kit.style.exit, kit.tempo),
  };
}

function settledAtMs(element: Element, kit: StyleKit): number {
  const { tempo } = kit;

  switch (element.kind) {
    case "title":
      return entranceEndMs(element.lines, element.entrance, element.enterMs, tempo);
    case "headline":
      return settledAtMs(headlineAsTitle(element, kit), kit);
    case "big-number":
      return settledAtMs(bigNumberAs(element), kit);
    case "counter":
      return element.enterMs + countDurationMs(tempo);
    case "chip":
    case "sticker":
      return element.enterMs + enterMs("pop", tempo);
    case "lower-third":
    case "quote":
    case "title-card":
    case "list":
    case "corner-label":
      return element.enterMs + enterMs("lift", tempo);
  }
}

// Measured every frame, after layout and before paint, so each frame draws from its own layout.
function useAnchorRect(container: RefObject<HTMLDivElement | null>, live: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    const measured = live && container.current ? anchorRect(container.current) : null;
    setRect((previous) => (sameRect(previous, measured) ? previous : measured));
  });

  return rect;
}

function anchorRect(container: HTMLDivElement): Rect | null {
  const origin = container.getBoundingClientRect();
  const scale = container.offsetWidth > 0 ? origin.width / container.offsetWidth : 0;
  const boxes = Array.from(container.querySelectorAll(anchorSelector), (node) =>
    node.getBoundingClientRect(),
  );
  const shown = boxes.filter((box) => box.width > 0 && box.height > 0);
  if (scale <= 0 || shown.length === 0) return null;

  const left = Math.min(...shown.map((box) => box.left));
  const top = Math.min(...shown.map((box) => box.top));
  const right = Math.max(...shown.map((box) => box.right));
  const bottom = Math.max(...shown.map((box) => box.bottom));

  return {
    x: (left - origin.left) / scale,
    y: (top - origin.top) / scale,
    w: (right - left) / scale,
    h: (bottom - top) / scale,
  };
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

function Mark(props: MarkProps) {
  const { mark } = props;

  switch (mark) {
    case "burst":
    case "sparkles":
    case "circle":
    case "underline":
      return <TextMark {...props} mark={mark} />;
    case "grow-frame":
    case "brackets":
    case "flash-blocks":
    case "selection":
      return <BoxMark {...props} mark={mark} />;
  }
}

// Drawn on the text itself.
function TextMark({ mark, rect, timing, kit, frame, color }: MarkProps & { mark: TextMarkKind }) {
  const { tempo } = kit;
  const stroke = frame.width * strokeShare;

  switch (mark) {
    case "burst":
      return (
        <Burst around={rect} atMs={timing.atMs} tempo={tempo} color={color} widthPx={stroke * boldStroke} />
      );
    case "sparkles": {
      const size = sparkleSize(rect, frame);
      return (
        <Sparkles points={sparklePoints(rect)} atMs={timing.atMs} size={size} tempo={tempo} color={color} />
      );
    }
    case "circle":
    case "underline":
      return (
        <Scribble kind={mark} around={rect} atMs={timing.atMs} tempo={tempo} color={color} widthPx={stroke} />
      );
  }
}

// Drawn around the text with some air.
function BoxMark({ mark, rect, timing, kit, frame, color }: MarkProps & { mark: BoxMarkKind }) {
  const { tempo } = kit;
  const { atMs } = timing;
  const box = padRect(rect, frame);
  const stroke = frame.width * strokeShare;

  switch (mark) {
    case "grow-frame": {
      const holdMs = timing.untilMs - atMs;
      const from = dotAt(centerOf(rect));
      return (
        <GrowFrame
          from={from}
          to={box}
          atMs={atMs}
          holdMs={holdMs}
          tempo={tempo}
          color={color}
          strokePx={stroke}
        />
      );
    }
    case "brackets": {
      const armPx = Math.min(box.w, box.h) * bracketArmShare;
      const widthPx = stroke * boldStroke;
      return (
        <CornerBrackets rect={box} atMs={atMs} tempo={tempo} color={color} armPx={armPx} widthPx={widthPx} />
      );
    }
    case "flash-blocks": {
      const blocks = [box, padRect(box, frame)];
      return <FlashBlocks blocks={blocks} atMs={atMs} tempo={tempo} color={kit.palette.highlight} />;
    }
    case "selection": {
      const handlePx = frame.width * handleShare;
      return <SelectionBox rect={box} atMs={atMs} tempo={tempo} color={color} handlePx={handlePx} />;
    }
  }
}

function padRect(rect: Rect, frame: Frame): Rect {
  const pad = Math.min(rect.h * padShare, frame.width * maxPadShare);
  return { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
}

function centerOf(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function dotAt(point: Point): Rect {
  return { x: point.x - 1, y: point.y - 1, w: 2, h: 2 };
}

function sparklePoints({ x, y, w, h }: Rect): Point[] {
  return [
    { x: x + w + h * 0.15, y: y - h * 0.1 },
    { x: x - h * 0.2, y: y + h * 0.75 },
    { x: x + w * 0.8, y: y + h * 1.15 },
  ];
}

function sparkleSize(rect: Rect, frame: Frame): number {
  const size = rect.h * sparkleShare;
  return Math.min(frame.width * sparkleRange.max, Math.max(frame.width * sparkleRange.min, size));
}
