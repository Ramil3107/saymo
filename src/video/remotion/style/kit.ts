import type { FieldTone } from "../../layout/compositions";
import { type Tempo, tempos } from "../../motion/tempo";
import type { VideoDoc } from "../../schema/video";
import { brandPalette, type FieldColors, fieldColors, type Palette } from "../../style/palette";
import { type Style, type StyleId, styles } from "../../styles";
import { displayFamily, loadBrandFont } from "../fonts";
import type { TransitionColors } from "../motion/SceneTransition";
import type { TypeColors, TypeFont } from "../type/KineticTitle";

export type StyleKit = {
  id: StyleId;
  style: Style;
  palette: Palette;
  tempo: Tempo;
  display: TypeFont;
  textFamily: string;
  colors: TypeColors;
  onFootage: TypeColors;
  panel: PanelTones;
  label: LabelTones;
  fields: Record<FieldTone, FieldColors>;
  transition: TransitionColors;
  scrim: string;
};

export type PanelTones = { background: string; text: string; accent: string };

export type LabelTones = {
  background: string;
  text: string;
  badge: string;
  badgeText: string;
  shadow: string;
  shape: "pill" | "slab";
};

const footageShadow = "0 2px 18px rgba(0, 0, 0, 0.55)";
const footageScrim =
  "radial-gradient(closest-side, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.32) 60%, rgba(0, 0, 0, 0))";
const white = "#FFFFFF";

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
    onFootage: {
      ink: white,
      accent: palette.highlight,
      alt: palette.accent,
      marker: palette.accent,
      shadow: footageShadow,
    },
    panel: panelTones(style, palette),
    label: labelTones(style, palette),
    fields: fieldTones(palette),
    transition: transitionColors(style, palette),
    scrim: footageScrim,
  };
}

function panelTones(style: Style, palette: Palette): PanelTones {
  if (style.surfaces.panel === "dark")
    return { background: palette.ink, text: white, accent: palette.highlight };

  return { background: palette.surface, text: palette.ink, accent: palette.accent };
}

// Soft labels are white pills with a soft shadow; block labels are flat highlight slabs with a hard offset shadow.
function labelTones(style: Style, palette: Palette): LabelTones {
  if (style.surfaces.labels === "block") {
    return {
      background: palette.highlight,
      text: palette.ink,
      badge: palette.ink,
      badgeText: palette.highlight,
      shadow: `6px 6px 0 ${palette.ink}`,
      shape: "slab",
    };
  }

  return {
    background: palette.surface,
    text: palette.ink,
    badge: palette.accent,
    badgeText: white,
    shadow: "0 12px 30px rgba(10, 10, 20, 0.22)",
    shape: "pill",
  };
}

function fieldTones(palette: Palette): Record<FieldTone, FieldColors> {
  return {
    accent: fieldColors(palette, "accent"),
    ink: fieldColors(palette, "ink"),
    highlight: fieldColors(palette, "highlight"),
    alt: fieldColors(palette, "alt"),
  };
}

function transitionColors(style: Style, palette: Palette): TransitionColors {
  const dip = style.surfaces.panel === "dark" ? palette.ink : palette.background;

  return { flash: white, dip, panel: palette.accent, edge: palette.highlight };
}
