import { Video } from "@remotion/media";
import type { CSSProperties } from "react";
import { useVideoConfig } from "remotion";
import type { Scene, VideoDoc } from "../../schema/video";
import { msToFrame } from "../frames";
import { Backdrop } from "../style/Textures";
import type { Theme } from "../theme";

type SceneFootage = NonNullable<Scene["footage"]>;
type Asset = VideoDoc["assets"][number];
type Props = { footage: SceneFootage; asset: Asset; durationMs: number; theme: Theme };
type Size = { width: number; height: number };

const cardRadiusShare = 0.028;

export function Footage({ footage, asset, durationMs, theme }: Props) {
  const { scale } = footage.transform;
  const size: Size | undefined =
    asset.width && asset.height ? { width: asset.width * scale, height: asset.height * scale } : undefined;
  const card = footage.fit === "card";

  return (
    <>
      {card ? <CardBackground theme={theme} /> : null}
      <div style={holderStyle(footage, size, card)}>
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
  const { width, height } = useVideoConfig();

  return <Backdrop kit={theme.kit} width={width} height={height} />;
}

function holderStyle(footage: SceneFootage, size: Size | undefined, card: boolean): CSSProperties {
  const { x, y } = footage.transform;

  return {
    position: "absolute",
    left: x,
    top: y,
    ...size,
    overflow: card ? "hidden" : undefined,
    borderRadius: card && size ? size.width * cardRadiusShare : undefined,
    boxShadow: card ? "0 40px 90px rgba(0, 8, 40, 0.55)" : undefined,
  };
}
