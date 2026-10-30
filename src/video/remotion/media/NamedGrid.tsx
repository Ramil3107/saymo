import type { CSSProperties } from "react";
import { Img } from "remotion";
import { poseAt } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased, staggered } from "../../motion/timeline";
import type { Rect } from "../accents/geometry";
import { useMs } from "../motion/Move";
import { TypeOn } from "../motion/TypeOn";

export type GridCell = { src: string; label: string; namedAtMs: number };

type Props = {
  cells: GridCell[];
  columns: number;
  area: Rect;
  atMs: number;
  tempo: Tempo;
  accent: string;
  ink: string;
};
type CellProps = Omit<Props, "cells" | "area" | "columns"> & {
  cell: GridCell;
  rect: Rect;
  index: number;
  latest: boolean;
};

const gapShare = 0.02;
const greyBrightness = 0.65;
const labelShare = 0.11;

// motionvid: the grid waits in grey, and each cell turns to color the moment the speaker names it.
export function NamedGrid({ cells, columns, area, atMs, tempo, accent, ink }: Props) {
  const ms = useMs();
  const latest = cells.filter((cell) => ms >= cell.namedAtMs).at(-1);

  return (
    <>
      {cells.map((cell, index) => (
        <Cell
          key={cell.label}
          cell={cell}
          rect={cellRect(index, columns, Math.ceil(cells.length / columns), area)}
          index={index}
          latest={cell === latest}
          atMs={atMs}
          tempo={tempo}
          accent={accent}
          ink={ink}
        />
      ))}
    </>
  );
}

function Cell({ cell, rect, index, latest, atMs, tempo, accent, ink }: CellProps) {
  const ms = useMs();
  const pose = poseAt(ms, { enter: "pop", atMs: staggered(atMs, index, tempo.staggerMs) }, tempo);
  if (!pose) return null;

  const colored = eased(ms, cell.namedAtMs, tempo.moveMs, tempo.enterCurve);

  return (
    <div
      style={{
        ...cellStyle(rect, pose.opacity, pose.scale),
        outline: latest ? `4px solid ${accent}` : "none",
      }}
    >
      <Img src={cell.src} style={photoStyle(colored)} />
      {ms >= cell.namedAtMs ? (
        <div style={labelStyle(rect, accent, ink)}>
          <TypeOn text={cell.label} atMs={cell.namedAtMs} tempo={tempo} />
        </div>
      ) : null}
    </div>
  );
}

function cellRect(index: number, columns: number, rows: number, area: Rect): Rect {
  const gap = area.w * gapShare;
  const w = (area.w - gap * (columns - 1)) / columns;
  const h = (area.h - gap * (rows - 1)) / rows;

  return {
    x: area.x + (index % columns) * (w + gap),
    y: area.y + Math.floor(index / columns) * (h + gap),
    w,
    h,
  };
}

function cellStyle(rect: Rect, opacity: number, scale: number): CSSProperties {
  return {
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    overflow: "hidden",
    opacity,
    transform: `scale(${scale})`,
  };
}

function photoStyle(colored: number): CSSProperties {
  const brightness = greyBrightness + (1 - greyBrightness) * colored;

  return {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: `grayscale(${1 - colored}) brightness(${brightness})`,
  };
}

function labelStyle(rect: Rect, accent: string, ink: string): CSSProperties {
  return {
    position: "absolute",
    left: rect.w * 0.06,
    bottom: rect.w * 0.06,
    padding: `0 ${rect.w * 0.03}px`,
    backgroundColor: accent,
    color: ink,
    fontSize: rect.w * labelShare,
    fontWeight: 900,
    letterSpacing: "0.04em",
  };
}
