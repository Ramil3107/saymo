import type { Tempo } from "../../motion/tempo";
import { eased, smoothstep, staggered } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import { type Point, type Rect, rectStyle } from "./geometry";

type Props = { rect: Rect; atMs: number; tempo: Tempo; color: string; handlePx: number };
type HandleProps = { at: Point; shown: number; handlePx: number; color: string };
type Corner = "top-left" | "top-right" | "bottom-right" | "bottom-left";

const drawMoves = 2;
const corners: Corner[] = ["top-left", "top-right", "bottom-right", "bottom-left"];

// motionvid: a design-tool selection draws around a tag, its corner handles pop in one by one.
export function SelectionBox({ rect, atMs, tempo, color, handlePx }: Props) {
  const ms = useMs();
  if (ms < atMs) return null;

  const drawn = eased(ms, atMs, tempo.moveMs * drawMoves, tempo.moveCurve);

  return (
    <svg style={{ ...rectStyle(rect), overflow: "visible" }} aria-hidden>
      <rect
        width={rect.w}
        height={rect.h}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - drawn}
        fill="none"
        stroke={color}
        strokeWidth={handlePx * 0.2}
      />
      {corners.map((corner, index) => (
        <Handle
          key={corner}
          at={cornerPoint(corner, rect)}
          shown={handleShown(ms, staggered(atMs, index, tempo.staggerMs * 2), tempo)}
          handlePx={handlePx}
          color={color}
        />
      ))}
    </svg>
  );
}

function Handle({ at, shown, handlePx, color }: HandleProps) {
  const size = handlePx * shown;

  return (
    <rect
      x={at.x - size / 2}
      y={at.y - size / 2}
      width={size}
      height={size}
      fill="#FFFFFF"
      stroke={color}
      strokeWidth={handlePx * 0.18}
    />
  );
}

function cornerPoint(corner: Corner, rect: Rect): Point {
  switch (corner) {
    case "top-left":
      return { x: 0, y: 0 };
    case "top-right":
      return { x: rect.w, y: 0 };
    case "bottom-right":
      return { x: rect.w, y: rect.h };
    case "bottom-left":
      return { x: 0, y: rect.h };
  }
}

function handleShown(ms: number, startMs: number, tempo: Tempo): number {
  return smoothstep(eased(ms, startMs, tempo.quickMs, tempo.popCurve));
}
