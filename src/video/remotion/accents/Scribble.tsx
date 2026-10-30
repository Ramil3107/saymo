import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Rect } from "./geometry";

type Props = {
  kind: "underline" | "circle";
  around: Rect;
  atMs: number;
  tempo: Tempo;
  color: string;
  widthPx: number;
};

const drawMoves = 3;
const circleOvershoot = 0.12;

// A hand-drawn mark: a wavy underline or a loose loop that overshoots its start, drawn as one stroke.
export function Scribble({ kind, around, atMs, tempo, color, widthPx }: Props) {
  const ms = useMs();
  const drawn = eased(ms, atMs, tempo.moveMs * drawMoves, tempo.moveCurve);
  if (drawn <= 0) return null;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      aria-hidden
    >
      <path
        d={kind === "underline" ? underlinePath(around) : circlePath(around)}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - drawn}
        fill="none"
        stroke={color}
        strokeWidth={widthPx}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function underlinePath({ x, y, w, h }: Rect): string {
  const base = y + h * 1.05;
  const wave = h * 0.08;

  return `M${x},${base} C${x + w * 0.3},${base - wave} ${x + w * 0.6},${base + wave} ${x + w},${base - wave * 0.5}`;
}

function circlePath({ x, y, w, h }: Rect): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w * 0.62;
  const ry = h * 0.8;
  const end = 2 * Math.PI * (1 + circleOvershoot);
  const steps = 48;

  return Array.from({ length: steps + 1 }, (_, step) => {
    const angle = -Math.PI * 0.6 + (end * step) / steps;
    const wobble = 1 + 0.04 * Math.sin(angle * 3);
    const point = `${cx + Math.cos(angle) * rx * wobble},${cy + Math.sin(angle) * ry * wobble}`;
    return `${step === 0 ? "M" : "L"}${point}`;
  }).join(" ");
}
