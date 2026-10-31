import { measureText } from "@remotion/layout-utils";
import type { CSSProperties } from "react";
import type { MoveSpec } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { countAt } from "../../motion/timeline";
import { Move, useMs } from "../motion/Move";
import { TypeOn } from "../motion/TypeOn";
import type { TypeColors, TypeFont } from "./KineticTitle";

type Props = {
  from: number;
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  ghost?: boolean;
  atMs: number;
  exit?: MoveSpec["exit"];
  colors: TypeColors;
  font: TypeFont;
  tempo: Tempo;
  width: number;
  sizeScale?: number;
  fill?: CounterFill;
};

// A counter that fills its box: the number as large as the box allows. A bleeding one, edgePx from the frame's
// left edge, runs past that edge by a share of its first figure, so the figure is cropped but still reads.
export type CounterFill = { height: number; edgePx?: number };

type Metrics = { perPx: number; firstPerPx: number; gapPerPx: number };

const countMoves = 4;
const numberShare = 0.34;
const fitShare = 0.88;
const suffixScale = 0.5;
const suffixGapEm = 0.25;
const measureSize = 100;
const minPerPx = 0.01;
const labelShare = 0.05;
const ghostScale = 2.4;
const cropShare = 0.35;
const filledNumberHeight = 0.78;
const labelLineHeight = 1.2;

const baseline: CSSProperties = { alignItems: "baseline" };

const column: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

export function countDurationMs(tempo: Tempo): number {
  return tempo.moveMs * countMoves;
}

export function Counter(props: Props) {
  const { from, to, decimals = 0, prefix = "", suffix = "", label, ghost, atMs, font, tempo } = props;
  const ms = useMs();
  const countMs = countDurationMs(tempo);
  const window = { startMs: atMs, durationMs: countMs, stepMs: tempo.countStepMs };
  const value = countAt(ms, window, { from, to, decimals }, tempo.enterCurve);
  const { fontSize, widthPx } = numberFit(`${prefix}${formatCount(to, decimals)}`, suffix, props);
  const indentPx = labelIndent(props, widthPx);

  return (
    <div
      style={{
        ...column,
        ...fillStyle(props, fontSize, widthPx),
        fontFamily: font.family,
        fontWeight: font.weight,
      }}
    >
      {ghost ? <GhostLayer {...props} fontSize={fontSize} /> : null}
      <CounterNumber {...props} prefix={prefix} suffix={suffix} value={value} fontSize={fontSize} />
      {label ? <Label {...props} text={label} atMs={atMs + countMs} indentPx={indentPx} /> : null}
    </div>
  );
}

function GhostLayer(props: Props & { fontSize: number }) {
  const { to, fontSize, atMs, exit, colors, tempo, width } = props;

  return (
    <Move
      spec={{ enter: "fade", atMs, exit }}
      tempo={tempo}
      unitPx={width}
      style={{ position: "absolute", inset: 0 }}
    >
      <Ghost text={formatCount(to, props.decimals ?? 0)} fontSize={fontSize} color={colors.ink} />
    </Move>
  );
}

function CounterNumber(props: Props & { prefix: string; suffix: string; value: number; fontSize: number }) {
  const { to, prefix, suffix, value, fontSize, atMs, exit, colors, tempo, width } = props;
  const suffixStyle: CSSProperties = {
    fontSize: fontSize * suffixScale,
    color: colors.accent,
    marginLeft: `${suffixGapEm}em`,
    whiteSpace: "pre",
  };

  return (
    <Move spec={{ enter: "punch", atMs, exit }} tempo={tempo} unitPx={width} innerStyle={baseline}>
      <Stable
        final={`${prefix}${formatCount(to, props.decimals ?? 0)}`}
        current={`${prefix}${formatCount(value, props.decimals ?? 0)}`}
        style={{ fontSize, color: colors.accent, lineHeight: 1, textShadow: colors.shadow }}
      />
      {suffix ? (
        <span data-anchor style={suffixStyle}>
          {suffix.trim()}
        </span>
      ) : null}
    </Move>
  );
}

function Label(props: Props & { text: string; indentPx: number }) {
  const { text, atMs, exit, colors, tempo, width, indentPx } = props;

  return (
    <Move spec={{ enter: "cut", atMs, exit }} tempo={tempo} unitPx={width} style={{ marginLeft: indentPx }}>
      <div
        data-anchor
        style={{
          fontSize: width * labelShare,
          lineHeight: labelLineHeight,
          color: colors.ink,
          letterSpacing: "0.14em",
          textShadow: colors.shadow,
        }}
      >
        <TypeOn text={text.toUpperCase()} atMs={atMs} tempo={tempo} />
      </div>
    </Move>
  );
}

function Stable({ final, current, style }: { final: string; current: string; style: CSSProperties }) {
  return (
    <span data-anchor style={{ ...style, position: "relative", display: "inline-block", whiteSpace: "pre" }}>
      <span style={{ visibility: "hidden" }}>{final}</span>
      <span style={{ position: "absolute", inset: 0, textAlign: "center" }}>{current}</span>
    </span>
  );
}

function Ghost({ text, fontSize, color }: { text: string; fontSize: number; color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${ghostScale})`,
        fontSize,
        lineHeight: 1,
        color: "transparent",
        WebkitTextStroke: `1px ${color}`,
        opacity: 0.12,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

// A filled counter sits on whole pixels, since huge figures at a fractional offset rasterize differently per tab:
// number and label keep to its left edge, and it is centered in its box by a whole-pixel padding.
// A bleeding one is as wide as its number, so the box's right edge holds it and the frame crops its left.
function fillStyle(props: Props, fontSize: number, widthPx: number): CSSProperties {
  const { fill, label, width } = props;
  if (!fill) return {};

  const labelPx = label ? width * labelShare * labelLineHeight : 0;
  return {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    paddingTop: Math.max(0, Math.round((fill.height - fontSize - labelPx) / 2)),
    width: fill.edgePx === undefined ? undefined : Math.ceil(widthPx),
  };
}

// A bleeding counter's label starts at its box's left edge, not at the cropped number's.
function labelIndent(props: Props, widthPx: number): number {
  if (props.fill?.edgePx === undefined) return 0;
  return Math.max(0, Math.ceil(widthPx) - Math.round(props.width));
}

function numberFit(number: string, suffix: string, props: Props): { fontSize: number; widthPx: number } {
  const metrics = numberMetrics(number, suffix, props.font);
  const fitted = numberSize(metrics, props);
  const fontSize = props.fill ? Math.floor(fitted) : fitted;

  return { fontSize, widthPx: fontSize * (metrics.perPx + metrics.gapPerPx) };
}

// The suffix is drawn at half size, so the number takes the width the suffix leaves.
function numberMetrics(number: string, suffix: string, font: TypeFont): Metrics {
  const style = { fontFamily: font.family, fontWeight: font.weight, fontSize: measureSize };
  const numberPx = measureText({ ...style, text: number }).width;
  const suffixPx = measureText({ ...style, text: suffix }).width * suffixScale;
  const firstPx = measureText({ ...style, text: number.slice(0, 1) }).width;

  return {
    perPx: (numberPx + suffixPx) / measureSize,
    firstPerPx: firstPx / measureSize,
    gapPerPx: suffix ? suffixScale * suffixGapEm : 0,
  };
}

function numberSize(metrics: Metrics, props: Props): number {
  const { width, sizeScale = 1, fill } = props;
  const perPx = Math.max(metrics.perPx, minPerPx);
  if (!fill) return Math.min(width * numberShare * sizeScale, (width * fitShare) / perPx);

  const tallest = fill.height * filledNumberHeight;
  if (fill.edgePx === undefined) return Math.min((width * fitShare) / perPx, tallest);

  const croppedPerPx = Math.max(perPx + metrics.gapPerPx - metrics.firstPerPx * cropShare, minPerPx);
  return Math.min((width + fill.edgePx) / croppedPerPx, tallest);
}

function formatCount(value: number, decimals: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
