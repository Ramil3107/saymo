import { Video } from "@remotion/media";
import type { Scene, VideoDoc } from "../../schema/video";
import { msToFrame } from "../frames";

type Footage = NonNullable<Scene["footage"]>;
type Asset = VideoDoc["assets"][number];

export function Footage({
  footage,
  asset,
  durationMs,
}: {
  footage: Footage;
  asset: Asset;
  durationMs: number;
}) {
  const { scale, x, y } = footage.transform;
  const size =
    asset.width && asset.height
      ? { width: asset.width * scale, height: asset.height * scale }
      : undefined;
  return (
    <div style={{ position: "absolute", left: x, top: y, ...size }}>
      <Video
        src={asset.src}
        trimBefore={msToFrame(footage.fromMs)}
        durationInFrames={msToFrame(durationMs)}
        muted={false}
        style={
          size
            ? { width: size.width, height: size.height, display: "block" }
            : undefined
        }
      />
    </div>
  );
}
