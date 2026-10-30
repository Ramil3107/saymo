import { type Tempo, tempos } from "../../motion/tempo";
import type { VideoDoc } from "../../schema/video";
import { brandPalette, type Palette } from "../../style/palette";
import { type Style, type StyleId, styles } from "../../styles";
import { displayFamily, loadBrandFont } from "../fonts";
import type { TypeColors, TypeFont } from "../type/KineticTitle";

export type StyleKit = {
  id: StyleId;
  style: Style;
  palette: Palette;
  tempo: Tempo;
  display: TypeFont;
  textFamily: string;
  colors: TypeColors;
};

// Everything a scene needs to draw in a style: the style's own choices with the brand's colors and font folded in.
export function styleKit(id: StyleId, brand: VideoDoc["brand"]): StyleKit {
  const style = styles[id];
  const palette = brandPalette(style.tones, brand.colors);

  return {
    id,
    style,
    palette,
    tempo: tempos[style.tempo],
    display: { family: displayFamily(style.display.font), weight: style.display.weight },
    textFamily: loadBrandFont(brand.font).fontFamily,
    colors: { ink: palette.ink, accent: palette.accent, alt: palette.alt, marker: palette.highlight },
  };
}
