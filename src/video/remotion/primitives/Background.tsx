import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { backdropView } from "../../motion/camera";
import type { Scene } from "../../schema/video";
import { Backdrop } from "../backdrop/Backdrop";
import { useMs } from "../motion/Move";
import { restingTransform } from "../motion/pixels";
import { type Frame, ink, type Theme } from "../theme";

type SceneBackground = Scene["background"];
type Props = {
  background: SceneBackground;
  camera: Scene["camera"];
  theme: Theme;
  frame: Frame;
  startMs: number;
  durationMs: number;
};

export function Background(props: Props) {
  if (props.background.kind === "style") return <MovingBackdrop {...props} />;

  return <AbsoluteFill style={backgroundStyle(props.background, props.theme)} />;
}

// The beat's camera moves the backdrop; the fields and text drawn over it stay still.
function MovingBackdrop({ camera, theme, frame, startMs, durationMs }: Props) {
  const sceneMs = useMs();
  const view = backdropView(camera, sceneMs, durationMs, theme.kit.tempo);
  const atRest = view.scale === 1 && view.x === 0 && view.y === 0;
  const transform = `translate(${view.x * frame.width}px, ${view.y * frame.height}px) scale(${view.scale})`;

  return (
    <AbsoluteFill style={{ transform: restingTransform(transform, atRest) }}>
      <Backdrop kit={theme.kit} frame={frame} ms={startMs + sceneMs} />
    </AbsoluteFill>
  );
}

function backgroundStyle(background: SceneBackground, theme: Theme): CSSProperties {
  const primary = theme.brand.colors[0] ?? ink;
  const secondary = theme.brand.colors[1] ?? primary;

  if (background.kind === "gradient")
    return { background: `linear-gradient(160deg, ${primary}, ${secondary})` };
  if (background.kind === "solid") return { backgroundColor: background.color ?? primary };
  return { backgroundColor: primary };
}
