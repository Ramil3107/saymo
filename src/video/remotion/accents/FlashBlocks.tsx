import type { Tempo } from "../../motion/tempo";
import { eased, staggered } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import { type Rect, rectStyle } from "./geometry";

type Props = { blocks: Rect[]; atMs: number; tempo: Tempo; color: string };

const flashFrames = 2;

// Snap flashes each block for two frames; glide wipes it in and out instead.
export function FlashBlocks({ blocks, atMs, tempo, color }: Props) {
  const ms = useMs();

  return (
    <>
      {blocks.map((block, index) => {
        const startMs = staggered(atMs, index, tempo.staggerMs * 2);
        const clip = tempo.flashMs > 0 ? flashClip(ms, startMs, tempo) : wipeClip(ms, startMs, tempo);
        if (clip === null) return null;
        return (
          <div
            key={`${block.x}-${block.y}`}
            style={{ ...rectStyle(block), backgroundColor: color, clipPath: clip }}
          />
        );
      })}
    </>
  );
}

function flashClip(ms: number, startMs: number, tempo: Tempo): string | null {
  const shown = ms >= startMs && ms < startMs + tempo.flashMs * flashFrames;
  return shown ? "none" : null;
}

function wipeClip(ms: number, startMs: number, tempo: Tempo): string | null {
  if (ms < startMs) return null;

  const covered = eased(ms, startMs, tempo.quickMs, tempo.enterCurve);
  const uncovered = eased(ms, startMs + tempo.quickMs * 2, tempo.quickMs, tempo.exitCurve);
  if (uncovered >= 1) return null;

  return `inset(0 ${(1 - covered) * 100}% 0 ${uncovered * 100}%)`;
}
