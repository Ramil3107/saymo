import { mixHex } from "../../style/color";
import { Grain } from "../accents/Grain";
import { wholePx } from "../motion/pixels";
import type { Frame } from "../theme";
import type { LookProps } from "./look";

type Tick = { id: string; x1: number; y1: number; x2: number; y2: number };

const cream = "#F2E7CC";
const creamShare = 0.6;
const lineDepth = 0.4;
const insetShare = 0.045;
const lineShare = 0.0019;
const tickShare = 0.03;
const grainOpacity = 0.16;
const corners = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
];

// Cream paper inside a thin ruled frame with ticks running out from its corners, after motionvid's Sketchbook.
export function Sketchbook({ palette, frame }: LookProps) {
  const paper = mixHex(palette.background, cream, creamShare);
  const line = mixHex(palette.ink, paper, lineDepth);
  const inset = wholePx(frame.width * insetShare);
  const stroke = Math.max(2, wholePx(frame.width * lineShare));

  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: paper }} />
      <div style={{ position: "absolute", inset, border: `${stroke}px solid ${line}` }} />
      <svg
        width={frame.width}
        height={frame.height}
        style={{ position: "absolute", left: 0, top: 0 }}
        aria-hidden
      >
        <g stroke={line} strokeWidth={stroke}>
          {cornerTicks(frame, inset, stroke).map(({ id, ...ends }) => (
            <line key={id} {...ends} />
          ))}
        </g>
      </svg>
      <Grain opacity={grainOpacity} />
    </>
  );
}

// Two short strokes out of each corner of the ruled frame, along its edges.
function cornerTicks(frame: Frame, inset: number, stroke: number): Tick[] {
  const tick = wholePx(frame.width * tickShare);
  const edge = inset + stroke / 2;

  return corners.flatMap((corner) => {
    const x = corner.x === 0 ? edge : frame.width - edge;
    const y = corner.y === 0 ? edge : frame.height - edge;
    const outX = corner.x === 0 ? -tick : tick;
    const outY = corner.y === 0 ? -tick : tick;

    return [
      { id: `${corner.x}${corner.y}-across`, x1: x, y1: y, x2: x + outX, y2: y },
      { id: `${corner.x}${corner.y}-down`, x1: x, y1: y, x2: x, y2: y + outY },
    ];
  });
}
