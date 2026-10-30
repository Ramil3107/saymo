import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Point } from "./geometry";

type Props = {
  from: Point;
  to: Point;
  bend: number;
  atMs: number;
  tempo: Tempo;
  color: string;
  widthPx: number;
};
type ShaftProps = { from: Point; control: Point; to: Point; drawn: number; color: string; widthPx: number };
type HeadLineProps = { tip: Point; end: Point; opened: number; color: string; widthPx: number };

const drawMoves = 3;
const headShare = 0.12;
const headAngle = 0.5;
const headFrom = 0.85;

// A curved stroke draws from its tail to its tip, and the head opens once the stroke arrives.
export function DrawnArrow({ from, to, bend, atMs, tempo, color, widthPx }: Props) {
  const ms = useMs();
  const drawn = eased(ms, atMs, tempo.moveMs * drawMoves, tempo.moveCurve);
  if (drawn <= 0) return null;

  const control = bendPoint(from, to, bend);
  const head = headLines(to, control, Math.hypot(to.x - from.x, to.y - from.y) * headShare);
  const opened = Math.max(0, (drawn - headFrom) / (1 - headFrom));

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      aria-hidden
    >
      <Shaft from={from} control={control} to={to} drawn={drawn} color={color} widthPx={widthPx} />
      {head.map((end) => (
        <HeadLine
          key={`${end.x}-${end.y}`}
          tip={to}
          end={end}
          opened={opened}
          color={color}
          widthPx={widthPx}
        />
      ))}
    </svg>
  );
}

function bendPoint(from: Point, to: Point, bend: number): Point {
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

  return { x: middle.x - (to.y - from.y) * bend, y: middle.y + (to.x - from.x) * bend };
}

function headLines(tip: Point, control: Point, length: number): Point[] {
  const back = Math.atan2(control.y - tip.y, control.x - tip.x);

  return [back - headAngle, back + headAngle].map((angle) => ({
    x: tip.x + Math.cos(angle) * length,
    y: tip.y + Math.sin(angle) * length,
  }));
}

function Shaft({ from, control, to, drawn, color, widthPx }: ShaftProps) {
  return (
    <path
      d={`M${from.x},${from.y} Q${control.x},${control.y} ${to.x},${to.y}`}
      pathLength={1}
      strokeDasharray="1"
      strokeDashoffset={1 - drawn}
      fill="none"
      stroke={color}
      strokeWidth={widthPx}
      strokeLinecap="round"
    />
  );
}

function HeadLine({ tip, end, opened, color, widthPx }: HeadLineProps) {
  return (
    <line
      x1={tip.x}
      y1={tip.y}
      x2={tip.x + (end.x - tip.x) * opened}
      y2={tip.y + (end.y - tip.y) * opened}
      stroke={color}
      strokeWidth={widthPx}
      strokeLinecap="round"
    />
  );
}
