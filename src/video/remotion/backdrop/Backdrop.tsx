import { AbsoluteFill } from "remotion";
import { Blobs } from "../accents/Blobs";
import { Grain } from "../accents/Grain";
import { PaperGrid } from "../accents/PaperGrid";
import type { StyleKit } from "../style/kit";
import type { Frame } from "../theme";
import { ColorWash } from "./ColorWash";
import { DotGrid } from "./DotGrid";
import { HalftoneScreen } from "./HalftoneScreen";
import { Night } from "./Night";
import { Pills } from "./Pills";
import { Sketchbook } from "./Sketchbook";
import { Streak } from "./Streak";
import { Studio } from "./Studio";

type Props = { kit: StyleKit; frame: Frame; ms: number };

const glowGrain = 0.35;
const gridShare = 0.055;
const gridLine = "rgba(20,20,26,0.06)";
const gridVignette = 0.18;

// The video's backdrop drawn in its palette; ms is the video's time, so the backdrop flows on across cuts.
export function Backdrop({ kit, frame, ms }: Props) {
  return (
    <AbsoluteFill style={{ backgroundColor: kit.palette.background }}>
      <Look kit={kit} frame={frame} ms={ms} />
    </AbsoluteFill>
  );
}

function Look({ kit, frame, ms }: Props) {
  const { palette } = kit;
  const look = { palette, frame, ms };

  switch (kit.backdrop) {
    case "glow":
      return (
        <>
          <Blobs
            colors={[palette.highlight, palette.accent, palette.alt]}
            width={frame.width}
            height={frame.height}
            ms={ms}
          />
          <Grain opacity={glowGrain} />
        </>
      );
    case "paper-grid":
      return <PaperGrid cellPx={frame.width * gridShare} lineColor={gridLine} vignette={gridVignette} />;
    case "color":
      return <ColorWash {...look} />;
    case "night":
      return <Night {...look} />;
    case "halftone":
      return <HalftoneScreen {...look} />;
    case "pills":
      return <Pills {...look} />;
    case "streak":
      return <Streak {...look} />;
    case "studio":
      return <Studio {...look} />;
    case "dots":
      return <DotGrid {...look} />;
    case "sketchbook":
      return <Sketchbook {...look} />;
  }
}
