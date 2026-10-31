import { mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Rect } from "./geometry";

type Props = { around: Rect; atMs: number; tempo: Tempo; color: string; widthPx: number };
type Ray = { cos: number; sin: number };

const rays = 10;
const rayDirections: Ray[] = Array.from({ length: rays }, (_, ray) => {
  const angle = (ray / rays) * Math.PI * 2;
  return { cos: Math.cos(angle), sin: Math.sin(angle) };
});
const burstMoves = 3;
const cornerReach = Math.SQRT2;
const startGap = 0.15;
const endGap = 0.9;
const rayLength = 1;

// Rays fly out from an ellipse that clears the rect's corners and shrink as they go.
export function Burst({ around, atMs, tempo, color, widthPx }: Props) {
  const ms = useMs();
  const p = eased(ms, atMs, tempo.moveMs * burstMoves, tempo.enterCurve);
  if (p <= 0 || p >= 1) return null;

  const unit = Math.min(around.w, around.h) / 2;
  const gap = mix(startGap, endGap, p) * unit;
  const length = (1 - p) * rayLength * unit;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      aria-hidden
    >
      {rayDirections.map((ray) => (
        <line
          key={`${ray.cos}-${ray.sin}`}
          {...rayEnds(ray, around, gap, length)}
          stroke={color}
          strokeWidth={widthPx}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function rayEnds({ cos, sin }: Ray, rect: Rect, gap: number, length: number) {
  const centerX = rect.x + rect.w / 2;
  const centerY = rect.y + rect.h / 2;
  const startX = centerX + cos * ((rect.w / 2) * cornerReach + gap);
  const startY = centerY + sin * ((rect.h / 2) * cornerReach + gap);

  return { x1: startX, y1: startY, x2: startX + cos * length, y2: startY + sin * length };
}
