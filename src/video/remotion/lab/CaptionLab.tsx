import { Video } from "@remotion/media";
import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { pagesFor } from "../../captions/looks";
import { destinations } from "../../destinations";
import { registers } from "../../registers";
import type { CaptionStyle } from "../../schema/plan";
import { defaultStyle } from "../../styles";
import { CaptionLayer } from "../captions/CaptionLayer";
import { FontsLoaded } from "../FontsLoaded";
import { loadBrandFont } from "../fonts";
import { msToFrame } from "../frames";
import { styleKit } from "../style/kit";
import type { Theme } from "../theme";
import { type CaptionLabProps, CaptionLabPropsSchema } from "./captionLabProps";

type PanelProps = {
  style: CaptionStyle;
  position: number;
  count: number;
  lab: CaptionLabProps;
  theme: Theme;
};

const groups: CaptionStyle[][] = [
  ["rail", "keyword-box", "bold-center"],
  ["pop", "karaoke", "karaoke-pill"],
  ["box", "minimal", "weight-shift"],
  ["marker", "typewriter"],
  ["editorial", "outline"],
];
const panel = { width: 540, height: 960, top: 92, gap: 50 };
const labWidth = 1920;
const safeZone = destinations.reels.safeZone;
const label = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: 24,
  fontWeight: 600,
  color: "white",
  opacity: 0.85,
};

export const captionLabMetadata: CalculateMetadataFunction<CaptionLabProps> = ({ props }) => {
  const lab = CaptionLabPropsSchema.parse(props);

  return { props: lab, durationInFrames: msToFrame(lab.durationMs * groups.length) };
};

export function CaptionLab(lab: CaptionLabProps) {
  const theme = labTheme(lab);

  return (
    <FontsLoaded>
      <AbsoluteFill style={{ backgroundColor: "#101014" }}>
        {groups.map((group, index) => (
          <Sequence
            key={group.join(" ")}
            from={msToFrame(index * lab.durationMs)}
            durationInFrames={msToFrame(lab.durationMs)}
          >
            {group.map((style, position) => (
              <CaptionPanel
                key={style}
                style={style}
                position={position}
                count={group.length}
                lab={lab}
                theme={theme}
              />
            ))}
          </Sequence>
        ))}
      </AbsoluteFill>
    </FontsLoaded>
  );
}

function labTheme(lab: CaptionLabProps): Theme {
  const brand = { colors: lab.colors, font: "Onest" };
  const kit = styleKit(defaultStyle[lab.register], brand);
  const { fontFamily } = loadBrandFont("Onest");

  return { brand, register: registers[lab.register], tempo: kit.tempo, kit, fontFamily, safeZone };
}

function CaptionPanel({ style, position, count, lab, theme }: PanelProps) {
  const left = panelLeft(position, count);
  const captions = { style, keywords: lab.keywords, pages: pagesFor(style, lab.words) };

  return (
    <>
      <div style={{ position: "absolute", left, top: panel.top - 34, ...label }}>{style}</div>
      <div
        style={{
          position: "absolute",
          left,
          top: panel.top,
          width: panel.width,
          height: panel.height,
          overflow: "hidden",
          borderRadius: 20,
        }}
      >
        <Video
          src={staticFile(lab.footage)}
          muted={position > 0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <CaptionLayer captions={captions} theme={theme} safeZone={safeZone} frame={panel} />
      </div>
    </>
  );
}

function panelLeft(position: number, count: number): number {
  const total = count * panel.width + (count - 1) * panel.gap;

  return (labWidth - total) / 2 + position * (panel.width + panel.gap);
}
