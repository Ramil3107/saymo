import { Grain } from "../accents/Grain";
import { halftoneDots } from "./halftoneDots";
import type { LookProps } from "./look";

const grainOpacity = 0.28;

// Accent dots on paper growing toward two corners, after the halftone on Higgsfield's portraits.
export function HalftoneScreen({ palette, frame, ms }: LookProps) {
  return (
    <>
      <svg
        width={frame.width}
        height={frame.height}
        style={{ position: "absolute", left: 0, top: 0 }}
        aria-hidden
      >
        <g fill={palette.accent}>
          {halftoneDots(frame, ms).map((dot) => (
            <circle key={dot.id} cx={dot.x} cy={dot.y} r={dot.r} />
          ))}
        </g>
      </svg>
      <Grain opacity={grainOpacity} />
    </>
  );
}
