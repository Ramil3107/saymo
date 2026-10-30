import type { CSSProperties } from "react";
import { interpolateColors } from "remotion";
import { type MoveSpec, mix } from "../../motion/moves";
import { countAt, eased, staggered } from "../../motion/timeline";
import { Move, useMs } from "../motion/Move";
import { TypeOn } from "../motion/TypeOn";
import type { DemoProps } from "./looks";

type DemoPropsWithoutHeight = Omit<DemoProps, "height">;

const startMs = 250;
const exitAtMs = 2400;
const swapAtMs = 1500;
const splitAtMs = 1300;
const riseLines = [
  ["Your", "words."],
  ["On", "the", "beat."],
];
const accentWord = "beat.";

const column: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const outlineNumeral: CSSProperties = {
  position: "absolute",
  fontWeight: 900,
  color: "transparent",
  lineHeight: 1,
  opacity: 0.7,
};

export function TypeOnDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;

  return (
    <Move
      spec={{ enter: "cut", atMs: 0, exit: { move: "fade", atMs: exitAtMs } }}
      tempo={tempo}
      unitPx={width}
      style={{ position: "absolute", inset: 0 }}
      innerStyle={{ fontSize: width * 0.1, fontWeight: 900, color: palette.ink, letterSpacing: "-0.02em" }}
    >
      <div style={{ width: width * 0.86, height: height * 0.3, display: "flex", alignItems: "center" }}>
        <TypeOn text="Make it move." atMs={startMs} tempo={tempo} caretColor={palette.accent} />
      </div>
    </Move>
  );
}

export function RiseDemo({ look, width }: DemoProps) {
  const { palette, tempo } = look;

  return (
    <div style={{ ...column, fontSize: width * 0.115, fontWeight: 900, lineHeight: 1.1 }}>
      {indexedLines(riseLines).map((line) => (
        <div key={line.key} style={{ display: "flex", gap: width * 0.03 }}>
          {line.words.map(({ word, index }) => {
            const spec: MoveSpec = {
              enter: "rise",
              atMs: staggered(startMs, index, tempo.wordMs),
              exit: { move: "sink", atMs: staggered(exitAtMs, index, tempo.staggerMs) },
            };
            return (
              <Move key={word} spec={spec} tempo={tempo} unitPx={width} style={{ display: "inline-block" }}>
                <span style={{ color: word === accentWord ? palette.accent : palette.ink }}>{word}</span>
              </Move>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function PunchCountDemo({ look, width }: DemoProps) {
  const { palette, tempo } = look;
  const ms = useMs();
  const count = countAt(
    ms,
    { startMs, durationMs: tempo.moveMs * 6, stepMs: tempo.countStepMs },
    { from: 10, to: 30 },
    tempo.enterCurve,
  );
  const exit: MoveSpec["exit"] = { move: "collapse", atMs: exitAtMs };

  return (
    <div style={column}>
      <div style={{ ...outlineNumeral, fontSize: width * 0.9, WebkitTextStroke: `2px ${palette.muted}` }}>
        30
      </div>
      <Move spec={{ enter: "punch", atMs: startMs, exit }} tempo={tempo} unitPx={width}>
        <div style={{ fontSize: width * 0.36, fontWeight: 900, color: palette.accent, lineHeight: 1 }}>
          {count}
        </div>
      </Move>
      <Move spec={{ enter: "smear", atMs: startMs + tempo.moveMs * 2, exit }} tempo={tempo} unitPx={width}>
        <div style={{ fontSize: width * 0.08, fontWeight: 700, color: palette.ink, letterSpacing: "0.2em" }}>
          SECONDS
        </div>
      </Move>
    </div>
  );
}

export function RevealSwapDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const ms = useMs();
  const flashing = tempo.flashMs > 0 && ms >= swapAtMs && ms < swapAtMs + tempo.flashMs;
  const swapped = eased(ms, swapAtMs, tempo.quickMs, tempo.moveCurve);
  const color = flashing
    ? palette.accentAlt
    : interpolateColors(swapped, [0, 1], [palette.ink, palette.accent]);

  return (
    <div style={column}>
      {flashing ? <div style={{ ...flashSquare(width, height), backgroundColor: palette.accent }} /> : null}
      <Move
        spec={{ enter: "reveal", atMs: startMs, exit: { move: "tilt", atMs: exitAtMs } }}
        tempo={tempo}
        unitPx={width}
      >
        <div style={{ fontSize: width * 0.15, fontWeight: 900, color, lineHeight: 1, textAlign: "center" }}>
          LAUNCH
          <br />
          DAY
        </div>
      </Move>
    </div>
  );
}

export function SplitDemo({ look, width, height }: DemoProps) {
  const { tempo } = look;
  const ms = useMs();
  const apart = eased(ms, splitAtMs, tempo.moveMs * 2, tempo.moveCurve);
  const shift = mix(width * 0.17, width * 0.36, apart);
  const scale = mix(1, 0.62, apart);

  return (
    <div style={column}>
      <div style={{ ...subject(width, height), opacity: apart, transform: `scale(${mix(0.8, 1, apart)})` }} />
      <SplitWord text="4" atMs={startMs} x={-shift} scale={scale} look={look} width={width} />
      <SplitWord
        text="K"
        atMs={startMs + tempo.staggerMs}
        x={shift}
        scale={scale}
        look={look}
        width={width}
      />
    </div>
  );
}

function indexedLines(lines: string[][]): { key: string; words: { word: string; index: number }[] }[] {
  let offset = 0;

  return lines.map((line) => {
    const words = line.map((word, position) => ({ word, index: offset + position }));
    offset += line.length;
    return { key: line.join(" "), words };
  });
}

function SplitWord(props: { text: string; atMs: number; x: number; scale: number } & DemoPropsWithoutHeight) {
  const { text, atMs, x, scale, look, width } = props;
  const exit: MoveSpec["exit"] = { move: "fade", atMs: exitAtMs };

  return (
    <Move spec={{ enter: "pop", atMs, exit }} tempo={look.tempo} unitPx={width} style={sideWord(x, scale)}>
      <div style={{ fontSize: width * 0.2, fontWeight: 900, color: look.palette.accent, lineHeight: 1 }}>
        {text}
      </div>
    </Move>
  );
}

function flashSquare(width: number, height: number): CSSProperties {
  return {
    position: "absolute",
    left: width * 0.18,
    top: height * 0.3,
    width: width * 0.3,
    height: width * 0.3,
  };
}

function subject(width: number, height: number): CSSProperties {
  return {
    position: "absolute",
    width: width * 0.46,
    height: height * 0.36,
    borderRadius: width * 0.23,
    background: "linear-gradient(160deg, #3A3F55, #9AA3C2)",
  };
}

function sideWord(x: number, scale: number): CSSProperties {
  return { position: "absolute", transform: `translateX(${x}px) scale(${scale})` };
}
