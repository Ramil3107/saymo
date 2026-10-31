import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill } from "remotion";
import { type StyleId, styles } from "../../styles";
import { FontsLoaded } from "../FontsLoaded";
import { msToFrame } from "../frames";
import { styleKit } from "../style/kit";
import { AdSpot, spotMs } from "./adSpot";
import { type CaptionLabProps, CaptionLabPropsSchema } from "./captionLabProps";

const panel = { width: 540, height: 960, top: 92, gap: 80 };
const labWidth = 1920;
const shown: StyleId[] = ["bold-pop", "clean-paper"];
const label = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: 24,
  fontWeight: 600,
  color: "white",
  opacity: 0.85,
};

export const styleLabMetadata: CalculateMetadataFunction<CaptionLabProps> = ({ props }) => ({
  props: CaptionLabPropsSchema.parse(props),
  durationInFrames: msToFrame(spotMs),
});

export function StyleLab(lab: CaptionLabProps) {
  return (
    <FontsLoaded>
      <AbsoluteFill style={{ backgroundColor: "#101014" }}>
        {shown.map((id, index) => (
          <StylePanel
            key={id}
            id={id}
            lab={lab}
            left={labWidth / 2 + (index === 0 ? -panel.gap / 2 - panel.width : panel.gap / 2)}
          />
        ))}
      </AbsoluteFill>
    </FontsLoaded>
  );
}

function StylePanel({ id, lab, left }: { id: StyleId; lab: CaptionLabProps; left: number }) {
  const kit = styleKit(id, { colors: lab.colors, font: "Onest" });

  return (
    <>
      <div style={{ position: "absolute", left, top: panel.top - 34, ...label }}>{styles[id].name}</div>
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
        <AdSpot kit={kit} lab={lab} width={panel.width} height={panel.height} />
      </div>
    </>
  );
}
