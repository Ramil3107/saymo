import { mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Point } from "./geometry";

type Props = { at: Point; atMs: number; size: number; tempo: Tempo; color: string };

const rays = 10;
const rayAngles = Array.from({ length: rays }, (_, ray) => (ray / rays) * Math.PI * 2);
const burstMoves = 3;

export function Burst({ at, atMs, size, tempo, color }: Props) {
  const ms = useMs();
  const p = eased(ms, atMs, tempo.moveMs * burstMoves, tempo.enterCurve);
  if (p <= 0 || p >= 1) return null;

  const inner = mix(0.25, 0.46, p) * size;
  const outer = inner + (1 - p) * size * 0.16;

  return (
    <svg
      width={size * 2}
      height={size * 2}
      style={{ position: "absolute", left: at.x - size, top: at.y - size }}
      aria-hidden
    >
      {rayAngles.map((angle) => (
        <line
          key={angle}
          {...rayEnds(angle, size, inner, outer)}
          stroke={color}
          strokeWidth={size * 0.035}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function rayEnds(angle: number, center: number, inner: number, outer: number) {
  return {
    x1: center + Math.cos(angle) * inner,
    y1: center + Math.sin(angle) * inner,
    x2: center + Math.cos(angle) * outer,
    y2: center + Math.sin(angle) * outer,
  };
}
