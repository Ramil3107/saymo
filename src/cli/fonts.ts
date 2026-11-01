import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { type Download, downloads, fontsourceFamily, libraryEntry, licenseUrl } from "../lib/fontsource";
import { readJson, writeJson } from "../lib/json";
import {
  type FontKind,
  FontKindSchema,
  type FontLibrary,
  FontLibrarySchema,
  type LibraryFont,
  LibraryFontSchema,
} from "../video/fonts/manifest";

const usage = "Usage: pnpm fonts:add <fontsource-id>... --kind <kind> [--fallback <id of a Cyrillic face>]";
const libraryDir = "public/fonts";
const manifestPath = join(libraryDir, "manifest.json");
const licenseName = "OFL.txt";
const note =
  "The font library the renders load from. Every family is under the SIL Open Font License 1.1, its license next to its files. Latin and Cyrillic woff2 from Fontsource, one variable file per subset and style where the family is variable. Add a family with pnpm fonts:add.";

await main();

// Adds families from Fontsource to the library: Latin and Cyrillic woff2, the license and an entry in the manifest.
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { kind: { type: "string" }, fallback: { type: "string" } },
  });
  if (positionals.length === 0 || !values.kind) throw new Error(usage);
  const kind = FontKindSchema.parse(values.kind);

  let library = await readLibrary();
  for (const id of positionals) {
    const font = await addFamily(id, kind, values.fallback);
    library = withFont(library, font);
    console.log(`${font.family}: ${font.files.length} files, ${font.subsets.join(" and ")}`);
  }
  await writeJson(manifestPath, library);
}

async function readLibrary(): Promise<FontLibrary> {
  const exists = await access(manifestPath).then(
    () => true,
    () => false,
  );

  return exists ? readJson(manifestPath, FontLibrarySchema) : { note, fonts: [] };
}

async function addFamily(id: string, kind: FontKind, fallback: string | undefined): Promise<LibraryFont> {
  const family = await fontsourceFamily(id);
  const { license } = family.font;
  if (license !== "OFL-1.1") throw new Error(`${id} is under ${license}, the library takes OFL-1.1 only`);

  const files = downloads(family);
  const licenseFile = join(id, licenseName);
  await Promise.all(files.map(saveFile));
  await save(licenseUrl(family), licenseFile);

  return LibraryFontSchema.parse(libraryEntry({ family, kind, fallback, downloads: files, licenseFile }));
}

function withFont(library: FontLibrary, font: LibraryFont): FontLibrary {
  const others = library.fonts.filter((known) => known.id !== font.id);
  const fonts = [...others, font].sort((a, b) => a.family.localeCompare(b.family));

  return { note: library.note, fonts };
}

function saveFile(file: Download): Promise<void> {
  return save(file.url, file.path);
}

async function save(url: string, path: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);

  const target = join(libraryDir, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}
