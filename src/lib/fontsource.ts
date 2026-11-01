import { z } from "zod";
import {
  type FontFile,
  type FontKind,
  FontStyleSchema,
  type FontSubset,
  type LibraryFont,
} from "../video/fonts/manifest";

export type FontsourceFamily = { font: FontsourceFont; weightRange?: { min: number; max: number } };
export type Download = FontFile & { url: string };

const api = "https://api.fontsource.org/v1";
const fileHost = "https://cdn.jsdelivr.net/fontsource/fonts";
const packageHost = "https://cdn.jsdelivr.net/npm/@fontsource";
const shippedSubsets: FontSubset[] = ["latin", "cyrillic"];
const hundred = 100;

const FontsourceFontSchema = z.object({
  id: z.string(),
  family: z.string(),
  subsets: z.array(z.string()),
  weights: z.array(z.number()),
  styles: z.array(FontStyleSchema),
  variable: z.boolean(),
  license: z.string(),
  version: z.string(),
  npmVersion: z.string(),
  unicodeRange: z.record(z.string(), z.string()),
});

const WeightAxisSchema = z.object({
  axes: z.object({ wght: z.object({ min: z.coerce.number(), max: z.coerce.number() }) }),
});

type FontsourceFont = z.infer<typeof FontsourceFontSchema>;

export async function fontsourceFamily(id: string): Promise<FontsourceFamily> {
  const font = FontsourceFontSchema.parse(await getJson(`${api}/fonts/${id}`));
  if (!font.variable) return { font };

  const { axes } = WeightAxisSchema.parse(await getJson(`${api}/variable/${id}`));
  return { font, weightRange: axes.wght };
}

// A variable family ships one file per subset and style; a static one, one per weight as well.
export function downloads(family: FontsourceFamily): Download[] {
  const { font, weightRange } = family;
  const subsets = shippedSubsets.filter((subset) => font.subsets.includes(subset));

  return font.styles.flatMap((style) =>
    subsets.flatMap((subset) => {
      const face = { subset, style, unicodeRange: rangeOf(font, subset) };
      if (!weightRange) return font.weights.map((weight) => staticDownload(font.id, face, weight));

      const url = `${fileHost}/${font.id}:vf@latest/${subset}-wght-${style}.woff2`;
      const weight = `${weightRange.min} ${weightRange.max}`;
      return [{ ...face, url, path: `${font.id}/${subset}-${style}.woff2`, weight }];
    }),
  );
}

export function licenseUrl(family: FontsourceFamily): string {
  return `${packageHost}/${family.font.id}@${family.font.npmVersion}/LICENSE`;
}

export function libraryEntry(input: {
  family: FontsourceFamily;
  kind: FontKind;
  fallback: string | undefined;
  downloads: Download[];
  licenseFile: string;
}): LibraryFont {
  const { font, weightRange } = input.family;

  return {
    id: font.id,
    family: font.family,
    kind: input.kind,
    weights: weightRange ? hundredsWithin(weightRange.min, weightRange.max) : font.weights,
    styles: font.styles,
    subsets: shippedSubsets.filter((subset) => font.subsets.includes(subset)),
    fallback: input.fallback,
    license: "OFL-1.1",
    licenseFile: input.licenseFile,
    source: `https://fontsource.org/fonts/${font.id}`,
    version: font.version,
    files: input.downloads.map(({ path, subset, style, weight, unicodeRange }) => ({
      path,
      subset,
      style,
      weight,
      unicodeRange,
    })),
  };
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);

  return response.json();
}

function rangeOf(font: FontsourceFont, subset: FontSubset): string {
  const range = font.unicodeRange[subset];
  if (!range) throw new Error(`Fontsource gives no unicode range for ${font.id} ${subset}`);

  return range;
}

function staticDownload(id: string, face: Omit<FontFile, "path" | "weight">, weight: number): Download {
  const name = `${face.subset}-${weight}-${face.style}.woff2`;

  return { ...face, url: `${fileHost}/${id}@latest/${name}`, path: `${id}/${name}`, weight: String(weight) };
}

function hundredsWithin(min: number, max: number): number[] {
  const first = Math.ceil(min / hundred);
  const last = Math.floor(max / hundred);

  return Array.from({ length: last - first + 1 }, (_, index) => (first + index) * hundred);
}
