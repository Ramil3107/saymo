import { mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased, linear, smoothstep } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import type { Point } from "./geometry";

type Props = { from: Point; to: Point; atMs: number; tempo: Tempo; color: string; size: number };

const travelMoves = 3;
const pressDip = 0.82;
const rippleMoves = 3;

// A pointer travels to its target and clicks: it dips, and a ring spreads from the tip.
export function Cursor({ from, to, atMs, tempo, color, size }: Props) {
  const ms = useMs();
  if (ms < atMs) return null;

  const travelMs = tempo.moveMs * travelMoves;
  const travelled = eased(ms, atMs, travelMs, tempo.moveCurve);
  const clickMs = atMs + travelMs;
  const pressed = ms >= clickMs && ms < clickMs + tempo.quickMs;
  const ripple = linear(ms, clickMs, tempo.moveMs * rippleMoves);
  const tip = { x: mix(from.x, to.x, travelled), y: mix(from.y, to.y, travelled) };

  return (
    <>
      {ripple > 0 && ripple < 1 ? <Ripple at={to} progress={ripple} size={size} color={color} /> : null}
      <Pointer tip={tip} size={size} pressed={pressed} />
    </>
  );
}

function Ripple({ at, progress, size, color }: { at: Point; progress: number; size: number; color: string }) {
  const radius = size * mix(0.2, 1.4, smoothstep(progress));

  return (
    <div
      style={{
        position: "absolute",
        left: at.x - radius,
        top: at.y - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: "50%",
        border: `${size * 0.08}px solid ${color}`,
        opacity: 1 - progress,
      }}
    />
  );
}

function Pointer({ tip, size, pressed }: { tip: Point; size: number; pressed: boolean }) {
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 20 26"
      style={{
        position: "absolute",
        left: tip.x,
        top: tip.y,
        transform: `scale(${pressed ? pressDip : 1})`,
        transformOrigin: "0 0",
      }}
      aria-hidden
    >
      <path
        d="M1,1 L1,21 L6,16 L10,25 L14,23 L10,15 L17,15 Z"
        fill="#FFFFFF"
        stroke="#0A0A0D"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}
