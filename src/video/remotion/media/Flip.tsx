import type { CSSProperties, ReactNode } from "react";
import { flipFace } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import { restingTransform } from "../motion/pixels";

type Props = { front: ReactNode; back: ReactNode; atMs: number; tempo: Tempo; style?: CSSProperties };

const flipMoves = 2;

// A card turns edge-on and comes back showing its other side: a state change you can see.
export function Flip({ front, back, atMs, tempo, style }: Props) {
  const face = flipFace(eased(useMs(), atMs, tempo.quickMs * flipMoves, tempo.moveCurve));

  const transform = restingTransform(`scaleX(${face.scaleX})`, face.scaleX === 1);

  return <div style={{ ...style, transform }}>{face.back ? back : front}</div>;
}
