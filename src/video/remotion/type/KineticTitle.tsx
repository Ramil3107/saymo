import { fitText } from "@remotion/layout-utils";
import type { CSSProperties } from "react";
import { interpolateColors } from "remotion";
import { type MoveSpec, mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased, linear, smoothstep } from "../../motion/timeline";
import {
  type Align,
  entranceEndMs,
  entranceMs,
  type LineCue,
  lineCues,
  type TitleEntrance,
  type TitleLine,
  type TitleSize,
  type Tone,
} from "../../type/schedule";
import { Move, useMs } from "../motion/Move";
import { TypeOn } from "../motion/TypeOn";

export type TypeColors = { ink: string; accent: string; alt: string; marker: string; shadow?: string };

export type TypeFont = { family: string; weight: number };

export type TitleProps = {
  lines: TitleLine[];
  entrance: TitleEntrance;
  atMs: number;
  exit?: MoveSpec["exit"];
  swapAtMs?: number;
  colors: TypeColors;
  font: TypeFont;
  tempo: Tempo;
  width: number;
};

type RowProps = TitleProps & { line: TitleLine; cue: LineCue; isLast: boolean; markAtMs: number };

const sizeShare: Record<TitleSize, number> = { xl: 0.22, l: 0.15, m: 0.095, s: 0.06 };
const fitShare = 0.92;
const lineHeight = 1.04;
const spreadFromEm = 0.7;
const markerHeight = "42%";
const justify: Record<Align, CSSProperties["justifyContent"]> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};
const swappedTone: Record<Tone, Tone> = { ink: "accent", accent: "ink", alt: "ink" };

export function KineticTitle(props: TitleProps) {
  const { lines, entrance, atMs, exit, tempo, width } = props;
  const cues = lineCues(lines, entrance, atMs, tempo);
  const markAtMs = entranceEndMs(lines, entrance, atMs, tempo) + tempo.quickMs;

  return (
    <Move
      spec={{ enter: "cut", atMs, exit }}
      tempo={tempo}
      unitPx={width}
      style={{ width }}
      innerStyle={{ flexDirection: "column", alignItems: "stretch", fontFamily: props.font.family }}
    >
      {lines.map((line, index) => {
        const cue = cues[index];
        if (!cue) return null;
        const isLast = index === lines.length - 1;
        return (
          <TitleRow key={line.text} {...props} line={line} cue={cue} isLast={isLast} markAtMs={markAtMs} />
        );
      })}
    </Move>
  );
}

function TitleRow(props: RowProps) {
  const { line, font, width, colors, tempo, swapAtMs, markAtMs } = props;
  const ms = useMs();
  const fontSize = lineFontSize(line, font, width);
  const marked = line.marked ? eased(ms, markAtMs, tempo.moveMs * 2, tempo.enterCurve) : 0;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: justify[line.align],
        fontSize,
        fontWeight: font.weight,
        lineHeight,
        color: toneColor(line.tone, colors, tempo, ms, swapAtMs),
        textShadow: colors.shadow,
      }}
    >
      <span data-anchor style={markerStyle(colors.marker, marked)}>
        <RowBody {...props} />
      </span>
    </div>
  );
}

function RowBody(props: RowProps) {
  const { line, cue, entrance, tempo, width, colors, isLast } = props;

  switch (entrance) {
    case "type":
      return (
        <TypeOn
          text={line.text}
          atMs={cue.atMs}
          tempo={tempo}
          caretColor={isLast ? colors.accent : undefined}
        />
      );
    case "rise":
    case "pop":
      return <Words cue={cue} enter={entrance} tempo={tempo} width={width} />;
    case "punch":
    case "reveal":
      return <WholeLine text={line.text} enter={entrance} atMs={cue.atMs} tempo={tempo} width={width} />;
    case "spread":
      return <Spread text={line.text} atMs={cue.atMs} tempo={tempo} />;
  }
}

function Words(props: { cue: LineCue; enter: "rise" | "pop"; tempo: Tempo; width: number }) {
  const { cue, enter, tempo, width } = props;

  return (
    <span style={{ display: "inline-flex", gap: "0.26em" }}>
      {cue.words.map((word) => (
        <Move
          key={`${word.text}${word.atMs}`}
          spec={{ enter, atMs: word.atMs }}
          tempo={tempo}
          unitPx={width}
          style={{ display: "inline-block" }}
        >
          {word.text}
        </Move>
      ))}
    </span>
  );
}

function WholeLine(props: {
  text: string;
  enter: "punch" | "reveal";
  atMs: number;
  tempo: Tempo;
  width: number;
}) {
  const { text, enter, atMs, tempo, width } = props;

  return (
    <Move spec={{ enter, atMs }} tempo={tempo} unitPx={width} style={{ display: "inline-block" }}>
      {text}
    </Move>
  );
}

function Spread({ text, atMs, tempo }: { text: string; atMs: number; tempo: Tempo }) {
  const ms = useMs();
  if (ms < atMs) return null;

  const duration = entranceMs("spread", tempo);
  const tightened = eased(ms, atMs, duration, tempo.enterCurve);
  const shown = smoothstep(Math.min(1, linear(ms, atMs, duration) * 2));

  return (
    <span
      style={{ letterSpacing: `${mix(spreadFromEm, 0, tightened)}em`, opacity: shown, whiteSpace: "pre" }}
    >
      {text}
    </span>
  );
}

function lineFontSize(line: TitleLine, font: TypeFont, width: number): number {
  const fitted = fitText({
    text: line.text,
    withinWidth: width * fitShare,
    fontFamily: font.family,
    fontWeight: font.weight,
  });

  return Math.min(width * sizeShare[line.size], fitted.fontSize);
}

function toneColor(
  tone: Tone,
  colors: TypeColors,
  tempo: Tempo,
  ms: number,
  swapAtMs: number | undefined,
): string {
  if (swapAtMs === undefined) return colors[tone];
  if (tempo.flashMs > 0 && ms >= swapAtMs && ms < swapAtMs + tempo.flashMs) return colors.alt;

  const swapped = eased(ms, swapAtMs, tempo.quickMs, tempo.moveCurve);
  return interpolateColors(swapped, [0, 1], [colors[tone], colors[swappedTone[tone]]]);
}

function markerStyle(color: string, progress: number): CSSProperties {
  return {
    backgroundImage: `linear-gradient(${color}, ${color})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0 86%",
    backgroundSize: `${progress * 100}% ${markerHeight}`,
    padding: "0 0.08em",
  };
}
