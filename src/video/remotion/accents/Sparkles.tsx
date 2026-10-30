import { poseAt } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { staggered } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Point } from "./geometry";

type Props = { points: Point[]; atMs: number; size: number; tempo: Tempo; color: string };
type StarProps = {
  at: Point;
  index: number;
  ms: number;
  atMs: number;
  size: number;
  tempo: Tempo;
  color: string;
};

const twinkleMs = 900;
const twinkleDepth = 0.18;
const starPath =
  "M0,-10 C1.2,-1.2 1.2,-1.2 10,0 C1.2,1.2 1.2,1.2 0,10 C-1.2,1.2 -1.2,1.2 -10,0 C-1.2,-1.2 -1.2,-1.2 0,-10 Z";

// Four-point stars pop in one after another and keep twinkling.
export function Sparkles({ points, atMs, size, tempo, color }: Props) {
  const ms = useMs();

  return (
    <>
      {points.map((point, index) => (
        <Star
          key={`${point.x}-${point.y}`}
          at={point}
          index={index}
          ms={ms}
          atMs={atMs}
          size={size}
          tempo={tempo}
          color={color}
        />
      ))}
    </>
  );
}

function Star({ at, index, ms, atMs, size, tempo, color }: StarProps) {
  const startMs = staggered(atMs, index, tempo.wordMs);
  const pose = poseAt(ms, { enter: "pop", atMs: startMs }, tempo);
  if (!pose) return null;

  const twinkle = 1 + twinkleDepth * Math.sin(((ms - startMs) / twinkleMs) * Math.PI * 2 + index);

  return (
    <svg
      width={size}
      height={size}
      viewBox="-10 -10 20 20"
      style={{
        position: "absolute",
        left: at.x - size / 2,
        top: at.y - size / 2,
        opacity: pose.opacity,
        transform: `scale(${pose.scale * twinkle}) rotate(${(ms - startMs) / 40}deg)`,
      }}
      aria-hidden
    >
      <path d={starPath} fill={color} />
    </svg>
  );
}
