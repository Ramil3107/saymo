import type { CSSProperties } from "react";
import type { MoveSpec } from "../../motion/moves";
import { eased, staggered } from "../../motion/timeline";
import { mixRect, type Rect, rectStyle } from "../accents/geometry";
import { Move, useMs } from "../motion/Move";
import type { DemoProps, Palette } from "./looks";

const startMs = 200;
const highlightAtMs = 1400;
const growAtMs = 1600;
const exitAtMs = 2400;
const tileCount = 6;
const grownIndex = 3;
const highlightBorder = 4;

export function CollageGrowDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const ms = useMs();
  const grown = eased(ms, growAtMs, tempo.moveMs * 2, tempo.moveCurve);
  const full: Rect = { x: width * 0.06, y: height * 0.25, w: width * 0.88, h: height * 0.5 };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: tileCount }, (_, index) => {
        const tile = tileRect(index, width, height);
        const rect = index === grownIndex ? mixRect(tile, full, grown) : tile;
        return <CollageTile key={tile.x} index={index} rect={rect} look={look} width={width} />;
      })}
      <Move
        spec={{ enter: "smear", atMs: exitAtMs + tempo.moveMs }}
        tempo={tempo}
        unitPx={width}
        style={{ position: "absolute", inset: 0 }}
      >
        <div style={{ fontSize: width * 0.16, fontWeight: 900, color: palette.ink }}>NEXT</div>
      </Move>
    </div>
  );
}

function CollageTile(props: { index: number; rect: Rect; look: DemoProps["look"]; width: number }) {
  const { index, rect, look, width } = props;
  const ms = useMs();
  const isGrown = index === grownIndex;
  const spec: MoveSpec = {
    enter: "pop",
    atMs: staggered(startMs, index, look.tempo.staggerMs),
    exit: isGrown ? { move: "tilt", atMs: exitAtMs } : { move: "fade", atMs: growAtMs },
  };
  const border = isGrown && ms >= highlightAtMs ? highlightBorder : 0;

  return (
    <Move
      spec={spec}
      tempo={look.tempo}
      unitPx={width}
      style={{ ...rectStyle(rect), zIndex: isGrown ? 2 : 1 }}
    >
      <div style={{ ...photo(look.palette, index), outline: `${border}px solid ${look.palette.accent}` }} />
    </Move>
  );
}

function tileRect(index: number, width: number, height: number): Rect {
  return {
    x: width * (0.05 + index * 0.1),
    y: height * (0.6 - index * 0.06),
    w: width * 0.4,
    h: width * 0.26,
  };
}

function photo(palette: Palette, index: number): CSSProperties {
  const tones = [palette.accent, palette.accentAlt, palette.highlight, palette.ink];
  const from = tones[index % tones.length] ?? palette.ink;
  const to = tones[(index + 1) % tones.length] ?? palette.muted;

  return {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    background: `radial-gradient(circle at 30% 35%, rgba(255,255,255,0.55), transparent 28%), linear-gradient(135deg, ${from}, ${to})`,
    boxShadow: "0 8px 24px rgba(10,10,20,0.18)",
  };
}
