import { defaultPalette, type PaletteId, palettes } from "./palettes";
import type { VideoDoc } from "./schema/video";

export type Brand = VideoDoc["brand"];

const defaultFont = "Onest";

// A video without a brand draws in a named palette, whose colors are read the way a brand's are.
export function paletteBrand(palette: PaletteId = defaultPalette): Brand {
  return { colors: [...palettes[palette].colors], font: defaultFont };
}

export const defaultBrand: Brand = paletteBrand();
