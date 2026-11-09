import { mixHex } from "../../style/color";
import { Grain } from "../accents/Grain";
import type { LookProps } from "./look";

const baseDepth = 0.74;
const glowShare = 0.35;
const shineShare = 0.78;
const periodMs = 14000;
const glowHome = { x: 62, y: 94 };
const shineHome = { x: 18, y: 8 };
const travel = 9;
const grainOpacity = 0.3;

// Near-black tinted by the palette's second tone, an accent glow rising from below and a fainter one above, as on
// Higgsfield's Content Factory card and motionvid's Floating Dark UI.
export function Night({ palette, ms }: LookProps) {
  const base = mixHex(palette.alt, palette.ink, baseDepth);
  const glow = mixHex(palette.accent, base, glowShare);
  const shine = mixHex(palette.accent, base, shineShare);
  const phase = (2 * Math.PI * ms) / periodMs;
  const glowAt = `${glowHome.x + Math.sin(phase) * travel}% ${glowHome.y + Math.cos(phase * 0.7) * travel * 0.5}%`;
  const shineAt = `${shineHome.x + Math.cos(phase * 0.9) * travel}% ${shineHome.y}%`;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `radial-gradient(ellipse 85% 55% at ${glowAt}, ${glow} 0%, transparent 70%)`,
            `radial-gradient(ellipse 60% 40% at ${shineAt}, ${shine} 0%, transparent 70%)`,
            base,
          ].join(", "),
        }}
      />
      <Grain opacity={grainOpacity} />
    </>
  );
}
