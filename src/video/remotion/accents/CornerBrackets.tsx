import { mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Rect } from "./geometry";

type Props = { rect: Rect; atMs: number; tempo: Tempo; color: string; armPx: number; widthPx: number };
type Bracket = { corner: string; d: string };

const startScale = 1.25;
const drawMoves = 2;

// Viewfinder brackets close in on a subject from slightly outside it.
export function CornerBrackets({ rect, atMs, tempo, color, armPx, widthPx }: Props) {
  const ms = useMs();
  const closed = eased(ms, atMs, tempo.moveMs * drawMoves, tempo.enterCurve);
  if (closed <= 0) return null;

  const box = scaledAroundCenter(rect, mix(startScale, 1, closed));
  const brackets = bracketPaths(box, armPx * closed);

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      aria-hidden
    >
      {brackets.map(({ corner, d }) => (
        <path key={corner} d={d} fill="none" stroke={color} strokeWidth={widthPx} strokeLinecap="square" />
      ))}
    </svg>
  );
}

function scaledAroundCenter(rect: Rect, scale: number): Rect {
  return {
    x: rect.x + (rect.w * (1 - scale)) / 2,
    y: rect.y + (rect.h * (1 - scale)) / 2,
    w: rect.w * scale,
    h: rect.h * scale,
  };
}

function bracketPaths(box: Rect, arm: number): Bracket[] {
  const right = box.x + box.w;
  const bottom = box.y + box.h;

  return [
    { corner: "top-left", d: `M${box.x},${box.y + arm} L${box.x},${box.y} L${box.x + arm},${box.y}` },
    { corner: "top-right", d: `M${right - arm},${box.y} L${right},${box.y} L${right},${box.y + arm}` },
    { corner: "bottom-right", d: `M${right},${bottom - arm} L${right},${bottom} L${right - arm},${bottom}` },
    { corner: "bottom-left", d: `M${box.x + arm},${bottom} L${box.x},${bottom} L${box.x},${bottom - arm}` },
  ];
}
