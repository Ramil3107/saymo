import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import type { Scene } from "../../schema/video";
import { ink, type Theme } from "../theme";

type SceneBackground = Scene["background"];

export function Background({ background, theme }: { background: SceneBackground; theme: Theme }) {
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
