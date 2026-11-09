import { mixHex } from "../../style/color";
import type { LookProps } from "./look";

const cellShare = 0.045;
const dotShare = 0.0019;
const dotDepth = 0.6;
const vignette = 0.14;

// A fine grid of dots on paper like a design canvas, a dot in the middle of the frame, darker toward the edges.
export function DotGrid({ palette, frame }: LookProps) {
  const cell = frame.width * cellShare;
  const radius = Math.max(1, frame.width * dotShare);
  const dot = mixHex(palette.ink, palette.background, dotDepth);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${dot} ${radius}px, transparent ${radius + 1}px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${centered(frame.width, cell)}px ${centered(frame.height, cell)}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(20, 16, 10, ${vignette}) 100%)`,
        }}
      />
    </>
  );
}

// The pattern's offset that puts a dot on the frame's middle line.
function centered(size: number, cell: number): number {
  return (((size / 2 - cell / 2) % cell) + cell) % cell;
}
