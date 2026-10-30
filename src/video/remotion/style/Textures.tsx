import { AbsoluteFill } from "remotion";
import type { Texture } from "../../styles";
import { Blobs } from "../accents/Blobs";
import { Grain } from "../accents/Grain";
import { Halftone } from "../accents/Halftone";
import { PaperGrid } from "../accents/PaperGrid";
import type { StyleKit } from "./kit";

type Props = { kit: StyleKit; width: number; height: number };

const grainOpacity = 0.35;
const gridShare = 0.055;

export function Backdrop({ kit, width, height }: Props) {
  return (
    <AbsoluteFill style={{ backgroundColor: kit.palette.background }}>
      {kit.style.textures.map((texture) => (
        <TextureLayer key={texture} texture={texture} kit={kit} width={width} height={height} />
      ))}
    </AbsoluteFill>
  );
}

function TextureLayer({ texture, kit, width, height }: Props & { texture: Texture }) {
  const { palette } = kit;

  switch (texture) {
    case "blobs":
      return (
        <Blobs colors={[palette.highlight, palette.accent, palette.alt]} width={width} height={height} />
      );
    case "grain":
      return <Grain opacity={grainOpacity} />;
    case "paper-grid":
      return <PaperGrid cellPx={width * gridShare} lineColor="rgba(20,20,26,0.06)" vignette={0.18} />;
    case "halftone":
      return <Halftone color={palette.ink} cellPx={width * 0.02} dotShare={0.3} angle={200} />;
  }
}
