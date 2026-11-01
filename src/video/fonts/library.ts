import manifest from "../../../public/fonts/manifest.json" with { type: "json" };
import { captionLooks } from "../captions/looks";
import type { VideoDoc } from "../schema/video";
import { defaultStyle, type StyleId, styles } from "../styles";
import { type FontKind, FontLibrarySchema, type LibraryFont } from "./manifest";

const genericFamilies: Record<FontKind, string> = {
  display: "sans-serif",
  sans: "sans-serif",
  serif: "serif",
  condensed: "sans-serif",
  rounded: "sans-serif",
  mono: "monospace",
  hand: "cursive",
};

export const fontLibrary: LibraryFont[] = FontLibrarySchema.parse(manifest).fonts;

const fallbackFont = requiredFont("onest");

export const captionSerif = requiredFont("playfair-display");

// A family is named by its id or its family name in any case: "Playfair Display" and "playfair-display" match.
export function findFont(name: string): LibraryFont | undefined {
  const id = fontId(name);
  return fontLibrary.find((font) => font.id === id);
}

export function libraryFont(name: string): LibraryFont {
  return findFont(name) ?? fallbackFont;
}

export function cssFamily(font: LibraryFont): string {
  const stack = [font, ...fallbackOf(font)].map((face) => `"${face.family}"`);
  return [...stack, genericFamilies[font.kind]].join(", ");
}

// The faces to load for a set of fonts: each once, with the Cyrillic face a Latin-only one falls back to.
export function withFallbacks(fonts: LibraryFont[]): LibraryFont[] {
  const all = fonts.flatMap((font) => [font, ...fallbackOf(font)]);
  return all.filter((font, index) => all.findIndex((other) => other.id === font.id) === index);
}

export function styleFonts(style: StyleId, brandFont: string): LibraryFont[] {
  return [libraryFont(styles[style].display.font), libraryFont(brandFont)];
}

export function documentFonts(doc: VideoDoc): LibraryFont[] {
  const style = doc.style ?? defaultStyle[doc.register];
  const serifCaptions = doc.captions && captionLooks[doc.captions.style].font === "serif";

  return withFallbacks([...styleFonts(style, doc.brand.font), ...(serifCaptions ? [captionSerif] : [])]);
}

function requiredFont(id: string): LibraryFont {
  const font = findFont(id);
  if (!font) throw new Error(`The font library has no ${id}`);

  return font;
}

function fontId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function fallbackOf(font: LibraryFont): LibraryFont[] {
  const fallback = font.fallback ? findFont(font.fallback) : undefined;
  return fallback ? [fallback] : [];
}
