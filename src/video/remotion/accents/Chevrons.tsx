import type { Tempo } from "../../motion/tempo";
import { chase } from "../../motion/timeline";
import { useMs } from "../motion/Move";

type Props = { tempo: Tempo; color: string; size: number; pointing: "left" | "right" };

const count = 3;
const step = 7;
const dimOpacity = 0.25;

export function Chevrons({ tempo, color, size, pointing }: Props) {
  const ms = useMs();
  const order = Array.from({ length: count }, (_, index) =>
    pointing === "right" ? index : count - 1 - index,
  );

  return (
    <svg width={size * count * 0.7} height={size} viewBox={`0 0 ${count * step} 10`} aria-hidden>
      {order.map((lit, position) => (
        <polyline
          key={lit}
          points={pointing === "right" ? "1,1 5,5 1,9" : "5,1 1,5 5,9"}
          transform={`translate(${position * step}, 0)`}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={chase(ms, tempo.blinkMs * 2, count, lit) ? 1 : dimOpacity}
        />
      ))}
    </svg>
  );
}
