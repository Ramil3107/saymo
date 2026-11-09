import { mixHex } from "../../style/color";
import { Grain } from "../accents/Grain";
import type { LookProps } from "./look";

const periodMs = 12000;
const spotHome = { x: 30, y: 26 };
const spotTravel = 12;
const lightShare = 0.24;
const deepShare = 0.3;
const grainOpacity = 0.22;

// The whole frame in the accent, lighter where a soft spot drifts and deeper toward the far corner, as on
// Higgsfield's Playable cards.
export function ColorWash({ palette, ms }: LookProps) {
  const phase = (2 * Math.PI * ms) / periodMs;
  const x = spotHome.x + Math.sin(phase) * spotTravel;
  const y = spotHome.y + Math.cos(phase * 0.8) * spotTravel;
  const light = mixHex(palette.accent, "#FFFFFF", lightShare);
  const deep = mixHex(palette.accent, palette.ink, deepShare);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${x}% ${y}%, ${light} 0%, ${palette.accent} 45%, ${deep} 100%)`,
        }}
      />
      <Grain opacity={grainOpacity} />
    </>
  );
}
