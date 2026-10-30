import type { CSSProperties } from "react";
import { Img } from "remotion";
import type { Tempo } from "../../motion/tempo";
import { linear, smoothstep } from "../../motion/timeline";
import { useMs } from "../motion/Move";

type Props = { srcs: string[]; atMs: number; cuts: number; tempo: Tempo };

const snapCutFrames = 2;
const glideHoldMoves = 1;

// A burst of shots: hard cuts two frames apart in snap, quick crossfades in glide.
export function Flicker({ srcs, atMs, cuts, tempo }: Props) {
  const ms = useMs();
  const stepMs = tempo.flashMs > 0 ? tempo.flashMs * snapCutFrames : tempo.moveMs * (1 + glideHoldMoves);
  if (ms < atMs || ms >= atMs + stepMs * cuts) return null;

  const step = Math.floor((ms - atMs) / stepMs);
  const current = srcs[step % srcs.length];
  const previous = srcs[(step + srcs.length - 1) % srcs.length];
  const blend = tempo.flashMs > 0 ? 1 : smoothstep(linear(ms, atMs + step * stepMs, tempo.moveMs));

  return (
    <>
      {previous && step > 0 ? <Img src={previous} style={fullCover(1)} /> : null}
      {current ? <Img src={current} style={fullCover(blend)} /> : null}
    </>
  );
}

function fullCover(opacity: number): CSSProperties {
  return { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity };
}
