import type { CSSProperties } from "react";
import { mixHex } from "../../style/color";
import type { Palette } from "../../style/palette";
import { Grain } from "../accents/Grain";
import type { Frame } from "../theme";
import type { LookProps } from "./look";
import { type Pill, type PillRow, pillRows, pillSquare } from "./pillRows";

type PillLook = { tints: string[]; border: string };

const angleDeg = -18;
const outlineShare = 0.0024;
const outlineDepth = 0.86;
const grainOpacity = 0.22;
const tintDepths = { accent: 0.76, highlight: 0.55, alt: 0.82 };

// Diagonal rows of rounded pills in light tints of the palette sliding past each other, after motionvid's
// Sticker Launch.
export function Pills({ palette, frame, ms }: LookProps) {
  const look = pillLook(palette, frame);

  return (
    <>
      <div style={squareStyle(frame)}>
        {pillRows(frame, ms).flatMap((row) =>
          row.pills.map((pill) => <div key={`${row.row}:${pill.slot}`} style={pillStyle(row, pill, look)} />),
        )}
      </div>
      <Grain opacity={grainOpacity} />
    </>
  );
}

function pillLook(palette: Palette, frame: Frame): PillLook {
  const width = Math.max(1, Math.round(frame.width * outlineShare));

  return {
    tints: [
      mixHex(palette.accent, palette.background, tintDepths.accent),
      mixHex(palette.highlight, palette.background, tintDepths.highlight),
      mixHex(palette.alt, palette.background, tintDepths.alt),
    ],
    border: `${width}px solid ${mixHex(palette.ink, palette.background, outlineDepth)}`,
  };
}

// The rows are laid in a square turned about the frame's middle, wide enough to cover it.
function squareStyle(frame: Frame): CSSProperties {
  const side = pillSquare(frame);

  return {
    position: "absolute",
    left: (frame.width - side) / 2,
    top: (frame.height - side) / 2,
    width: side,
    height: side,
    transform: `rotate(${angleDeg}deg)`,
  };
}

function pillStyle(row: PillRow, pill: Pill, look: PillLook): CSSProperties {
  return {
    position: "absolute",
    left: pill.x,
    top: row.y,
    width: pill.w,
    height: row.h,
    boxSizing: "border-box",
    borderRadius: row.h / 2,
    border: look.border,
    backgroundColor: look.tints[pill.tint],
  };
}
