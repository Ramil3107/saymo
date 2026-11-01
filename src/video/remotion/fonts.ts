import { staticFile } from "remotion";
import { withFallbacks } from "../fonts/library";
import type { FontFile, LibraryFont } from "../fonts/manifest";

const loads = new Map<string, Promise<void>>();

// Faces come from the library in `public/fonts`, each family once per page, so no render waits on the network.
export async function loadFonts(fonts: LibraryFont[]): Promise<void> {
  await Promise.all(withFallbacks(fonts).map(loadFamily));
}

function loadFamily(font: LibraryFont): Promise<void> {
  const known = loads.get(font.id);
  if (known) return known;

  const loading = Promise.all(font.files.map((file) => loadFace(font.family, file))).then(() => undefined);
  loads.set(font.id, loading);
  return loading;
}

async function loadFace(family: string, file: FontFile): Promise<void> {
  const source = `url("${staticFile(`fonts/${file.path}`)}") format("woff2")`;
  const face = new FontFace(family, source, {
    weight: file.weight,
    style: file.style,
    unicodeRange: file.unicodeRange,
  });

  document.fonts.add(await face.load());
}
