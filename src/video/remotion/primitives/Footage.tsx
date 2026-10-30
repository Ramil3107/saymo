import { Video } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import type { Scene, VideoDoc } from "../../schema/video";
import { msToFrame } from "../frames";
import { darken, panelColor, type Theme } from "../theme";

type SceneFootage = NonNullable<Scene["footage"]>;
type Asset = VideoDoc["assets"][number];
type Props = { footage: SceneFootage; asset: Asset; durationMs: number; theme: Theme };

const cardRadiusShare = 0.028;

export function Footage({ footage, asset, durationMs, theme }: Props) {
  const { scale, x, y } = footage.transform;
  const size =
    asset.width && asset.height ? { width: asset.width * scale, height: asset.height * scale } : undefined;
  const card = footage.fit === "card";

  return (
    <>
      {card ? <CardBackground theme={theme} /> : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          ...size,
          overflow: card ? "hidden" : undefined,
          borderRadius: card && size ? size.width * cardRadiusShare : undefined,
          boxShadow: card ? "0 40px 90px rgba(0, 8, 40, 0.55)" : undefined,
        }}
      >
        <Video
          src={asset.src}
          trimBefore={msToFrame(footage.fromMs)}
          durationInFrames={msToFrame(durationMs)}
          muted={false}
          style={size ? { ...size, display: "block" } : undefined}
        />
      </div>
    </>
  );
}

function CardBackground({ theme }: { theme: Theme }) {
  const base = panelColor(theme);
  const deep = darken(theme.brand.colors[0] ?? "#0D1D42", 0.75);
  const lift = darken(theme.brand.colors[0] ?? "#0D1D42", 0.3);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 900px at 50% 30%, ${lift} 0%, ${base} 45%, ${deep} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.18,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.9) 1.6px, transparent 1.8px)",
          backgroundSize: "34px 34px",
        }}
      />
    </AbsoluteFill>
  );
}
