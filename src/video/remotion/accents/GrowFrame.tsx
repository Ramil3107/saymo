import type { Tempo } from "../../motion/tempo";
import { eased, linear, smoothstep } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import { mixRect, type Rect, rectStyle } from "./geometry";

type Props = {
  from: Rect;
  to: Rect;
  atMs: number;
  holdMs: number;
  tempo: Tempo;
  color: string;
  strokePx: number;
};

const growMoves = 2.5;
const startStroke = 4;
const tintOpacity = 0.35;

// Higgsfield: a frame grows from a point to the edges, thick at first, and the shot flashes the frame's color.
export function GrowFrame({ from, to, atMs, holdMs, tempo, color, strokePx }: Props) {
  const ms = useMs();
  if (ms < atMs) return null;

  const growMs = tempo.moveMs * growMoves;
  const grown = eased(ms, atMs, growMs, tempo.moveCurve);
  const faded = smoothstep(linear(ms, atMs + growMs + holdMs, tempo.moveMs));
  if (faded >= 1) return null;

  const tinted = tempo.flashMs > 0 && ms < atMs + tempo.flashMs * 2;

  return (
    <div
      style={{
        ...rectStyle(mixRect(from, to, grown)),
        border: `${strokePx * (startStroke - (startStroke - 1) * grown)}px solid ${color}`,
        opacity: 1 - faded,
      }}
    >
      {tinted ? (
        <div style={{ position: "absolute", inset: 0, backgroundColor: color, opacity: tintOpacity }} />
      ) : null}
    </div>
  );
}
