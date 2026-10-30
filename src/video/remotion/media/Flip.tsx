import type { CSSProperties, ReactNode } from "react";
import { flipFace } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";

type Props = { front: ReactNode; back: ReactNode; atMs: number; tempo: Tempo; style?: CSSProperties };

const flipMoves = 2;

// A card turns edge-on and comes back showing its other side: a state change you can see.
export function Flip({ front, back, atMs, tempo, style }: Props) {
  const face = flipFace(eased(useMs(), atMs, tempo.quickMs * flipMoves, tempo.moveCurve));

  return <div style={{ ...style, transform: `scaleX(${face.scaleX})` }}>{face.back ? back : front}</div>;
}
