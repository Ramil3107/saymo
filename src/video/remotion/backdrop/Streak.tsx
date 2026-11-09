import type { CSSProperties } from "react";
import { Grain } from "../accents/Grain";
import type { Frame } from "../theme";
import type { LookProps } from "./look";

// A stroke's place and size as shares of the frame, how far it drifts and where in its swing it starts.
type Stroke = { y: number; width: number; height: number; travel: number; phase: number; opacity: number };

const periodMs = 9000;
const tiltDeg = -7;
const grainOpacity = 0.2;
const accentStrokes: Stroke[] = [
  { y: 0.64, width: 1.7, height: 0.085, travel: 0.2, phase: 0, opacity: 1 },
  { y: 0.585, width: 0.9, height: 0.01, travel: 0.34, phase: 0.6, opacity: 0.8 },
  { y: 0.7, width: 0.7, height: 0.008, travel: 0.4, phase: 1.7, opacity: 0.7 },
  { y: 0.725, width: 1.1, height: 0.012, travel: 0.3, phase: 2.6, opacity: 0.55 },
];
const highlightStrokes: Stroke[] = [
  { y: 0.3, width: 1.2, height: 0.035, travel: -0.3, phase: 1, opacity: 1 },
  { y: 0.33, width: 0.6, height: 0.006, travel: -0.45, phase: 2.2, opacity: 0.8 },
];

// A long smear of the accent with speed lines around it drifting across the paper, and a thinner highlight one
// above going the other way, like the motion smear on Higgsfield's Content Factory card.
export function Streak({ palette, frame, ms }: LookProps) {
  const turn = (2 * Math.PI * ms) / periodMs;
  const strokes = [
    ...accentStrokes.map((stroke) => ({ stroke, color: palette.accent })),
    ...highlightStrokes.map((stroke) => ({ stroke, color: palette.highlight })),
  ];

  return (
    <>
      {strokes.map(({ stroke, color }) => (
        <div key={`${stroke.y}-${stroke.width}`} style={strokeStyle(frame, stroke, color, turn)} />
      ))}
      <Grain opacity={grainOpacity} />
    </>
  );
}

// Tapered at both ends and soft at the top and bottom, so it reads as a smear rather than a shape.
function strokeStyle(frame: Frame, stroke: Stroke, color: string, turn: number): CSSProperties {
  const width = frame.width * stroke.width;
  const height = frame.height * stroke.height;
  const shift = Math.sin(turn + stroke.phase) * stroke.travel;
  const soften = "linear-gradient(180deg, transparent 0%, black 35%, black 65%, transparent 100%)";

  return {
    position: "absolute",
    left: frame.width * (0.5 + shift) - width / 2,
    top: frame.height * stroke.y - height / 2,
    width,
    height,
    opacity: stroke.opacity,
    background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
    maskImage: soften,
    WebkitMaskImage: soften,
    transform: `rotate(${tiltDeg}deg)`,
  };
}
