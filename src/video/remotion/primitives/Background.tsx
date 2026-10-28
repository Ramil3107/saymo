import { AbsoluteFill } from "remotion";
import type { Scene } from "../../schema/video";
import type { Theme } from "../theme";

export function Background({
  background,
  theme,
}: {
  background: Scene["background"];
  theme: Theme;
}) {
  const primary = theme.brand.colors[0] ?? "#08080B";
  const secondary = theme.brand.colors[1] ?? primary;
  const style: React.CSSProperties =
    background.kind === "gradient"
      ? { background: `linear-gradient(160deg, ${primary}, ${secondary})` }
      : {
          backgroundColor:
            background.kind === "solid"
              ? (background.color ?? primary)
              : primary,
        };
  return <AbsoluteFill style={style} />;
}
