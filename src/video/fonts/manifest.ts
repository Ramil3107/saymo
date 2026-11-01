import { z } from "zod";

export const FontKindSchema = z.enum(["display", "sans", "serif", "condensed", "rounded", "mono", "hand"]);
export const FontSubsetSchema = z.enum(["latin", "cyrillic"]);
export const FontStyleSchema = z.enum(["normal", "italic"]);

export const FontFileSchema = z.object({
  path: z.string(),
  subset: FontSubsetSchema,
  style: FontStyleSchema,
  weight: z.string(),
  unicodeRange: z.string(),
});

export const LibraryFontSchema = z
  .object({
    id: z.string(),
    family: z.string(),
    kind: FontKindSchema,
    weights: z.array(z.number()),
    styles: z.array(FontStyleSchema),
    subsets: z.array(FontSubsetSchema),
    fallback: z.string().optional(),
    license: z.literal("OFL-1.1"),
    licenseFile: z.string(),
    source: z.url(),
    version: z.string(),
    files: z.array(FontFileSchema).min(1),
  })
  .refine((font) => font.subsets.includes("cyrillic") || font.fallback, {
    message: "A face without Cyrillic names a fallback face that has it",
  });

export const FontLibrarySchema = z.object({ note: z.string(), fonts: z.array(LibraryFontSchema) });

export type FontKind = z.infer<typeof FontKindSchema>;
export type FontSubset = z.infer<typeof FontSubsetSchema>;
export type FontFile = z.infer<typeof FontFileSchema>;
export type LibraryFont = z.infer<typeof LibraryFontSchema>;
export type FontLibrary = z.infer<typeof FontLibrarySchema>;
