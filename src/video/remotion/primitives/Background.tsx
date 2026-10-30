import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import type { Scene } from "../../schema/video";
import { Backdrop } from "../style/Textures";
import { type Frame, ink, type Theme } from "../theme";

type SceneBackground = Scene["background"];

export function Background({
  background,
  theme,
  frame,
}: {
  background: SceneBackground;
  theme: Theme;
  frame: Frame;
}) {
  if (background.kind === "style")
    return <Backdrop kit={theme.kit} width={frame.width} height={frame.height} />;

  return <AbsoluteFill style={backgroundStyle(background, theme)} />;
}

function backgroundStyle(background: SceneBackground, theme: Theme): CSSProperties {
  const primary = theme.brand.colors[0] ?? ink;
  const secondary = theme.brand.colors[1] ?? primary;

  if (background.kind === "gradient")
    return { background: `linear-gradient(160deg, ${primary}, ${secondary})` };
  if (background.kind === "solid") return { backgroundColor: background.color ?? primary };
  return { backgroundColor: primary };
}
