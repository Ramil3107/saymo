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
};

const countMoves = 4;
const numberShare = 0.34;
const fitShare = 0.88;
const suffixScale = 0.5;
const suffixGapEm = 0.25;
const measureSize = 100;
const minPerPx = 0.01;
const labelShare = 0.05;
const ghostScale = 2.4;
const numberFormat = new Intl.NumberFormat("en-US");

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
  const { from, to, prefix = "", suffix = "", label, ghost, atMs, font, tempo, width } = props;
  const ms = useMs();
  const countMs = countDurationMs(tempo);
  const window = { startMs: atMs, durationMs: countMs, stepMs: tempo.countStepMs };
  const value = countAt(ms, window, { from, to }, tempo.enterCurve);
  const fontSize = numberSize(`${prefix}${numberFormat.format(to)}`, suffix, font, width);

  return (
    <div style={{ ...column, fontFamily: font.family, fontWeight: font.weight }}>
      {ghost ? <GhostLayer {...props} fontSize={fontSize} /> : null}
      <CounterNumber {...props} prefix={prefix} suffix={suffix} value={value} fontSize={fontSize} />
      {label ? <Label {...props} text={label} atMs={atMs + countMs} /> : null}
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
      <Ghost text={numberFormat.format(to)} fontSize={fontSize} color={colors.ink} />
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
        final={`${prefix}${numberFormat.format(to)}`}
        current={`${prefix}${numberFormat.format(value)}`}
        style={{ fontSize, color: colors.accent, lineHeight: 1 }}
      />
      {suffix ? <span style={suffixStyle}>{suffix.trim()}</span> : null}
    </Move>
  );
}

function Label(props: Props & { text: string }) {
  const { text, atMs, exit, colors, tempo, width } = props;

  return (
    <Move spec={{ enter: "cut", atMs, exit }} tempo={tempo} unitPx={width}>
      <div style={{ fontSize: width * labelShare, color: colors.ink, letterSpacing: "0.14em" }}>
        <TypeOn text={text.toUpperCase()} atMs={atMs} tempo={tempo} />
      </div>
    </Move>
  );
}

function Stable({ final, current, style }: { final: string; current: string; style: CSSProperties }) {
  return (
    <span style={{ ...style, position: "relative", display: "inline-block", whiteSpace: "pre" }}>
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

// The suffix is drawn at half size, so the number takes the width the suffix leaves.
function numberSize(number: string, suffix: string, font: TypeFont, width: number): number {
  const style = { fontFamily: font.family, fontWeight: font.weight, fontSize: measureSize };
  const perPx =
    (measureText({ ...style, text: number }).width +
      measureText({ ...style, text: suffix }).width * suffixScale) /
    measureSize;

  return Math.min(width * numberShare, (width * fitShare) / Math.max(perPx, minPerPx));
}
