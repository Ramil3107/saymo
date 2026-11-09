import { mixHex } from "../../style/color";
import type { LookProps } from "./look";

const studioGrey = "#ECEFF3";
const accentTrace = 0.05;
const floorShade = 0.09;

// A cool light grey lit from above and a touch darker toward the floor, after motionvid's Apple look.
export function Studio({ palette }: LookProps) {
  const base = mixHex(studioGrey, palette.accent, accentTrace);
  const floor = mixHex(base, palette.ink, floorShade);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: [
          "radial-gradient(ellipse 95% 60% at 50% -8%, #FFFFFF 0%, transparent 72%)",
          `linear-gradient(180deg, ${base} 55%, ${floor} 100%)`,
        ].join(", "),
      }}
    />
  );
}
