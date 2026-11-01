import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sampleDoc from "../../../../fixtures/video.sample.json" with { type: "json" };
import { VideoDocSchema } from "../../schema/video";
import { styles } from "../../styles";
import { cssFamily, documentFonts, findFont, fontLibrary, libraryFont, withFallbacks } from "../library";

const libraryDir = "public/fonts";
const sample = VideoDocSchema.parse(sampleDoc);

describe("the font library", () => {
  it.each(fontLibrary.map((font) => [font.family, font]))("keeps the files and license of %s", (_, font) => {
    const paths = [...font.files.map((file) => file.path), font.licenseFile];
    expect(paths.filter((path) => !existsSync(join(libraryDir, path)))).toEqual([]);
  });

  it("finds every family by its name", () => {
    expect(fontLibrary.filter((font) => findFont(font.family) !== font)).toEqual([]);
  });

  it("gives every Latin-only face a fallback with Cyrillic", () => {
    const latinOnly = fontLibrary.filter((font) => !font.subsets.includes("cyrillic"));
    const fallbacks = latinOnly.map((font) => findFont(font.fallback ?? ""));

    expect(latinOnly.length).toBeGreaterThan(0);
    expect(fallbacks.every((fallback) => fallback?.subsets.includes("cyrillic"))).toBe(true);
  });

  it.each(Object.entries(styles))("holds the display face of %s", (_, style) => {
    expect(findFont(style.display.font)).toBeDefined();
  });
});

describe("libraryFont", () => {
  it("matches a family by its name or id in any case", () => {
    expect(libraryFont("Playfair Display").id).toBe("playfair-display");
    expect(libraryFont("playfair-display").id).toBe("playfair-display");
    expect(libraryFont("  JETBRAINS mono ").id).toBe("jetbrains-mono");
  });

  it("falls back to Onest for a family the library does not have", () => {
    expect(libraryFont("Comic Sans MS").id).toBe("onest");
  });
});

describe("cssFamily", () => {
  it("quotes the family and ends with a generic family", () => {
    expect(cssFamily(libraryFont("Exo 2"))).toBe('"Exo 2", sans-serif');
    expect(cssFamily(libraryFont("Lora"))).toBe('"Lora", serif');
  });

  it("puts the Cyrillic fallback after a Latin-only face", () => {
    expect(cssFamily(libraryFont("Anton"))).toBe('"Anton", "Oswald", sans-serif');
  });
});

describe("withFallbacks", () => {
  it("adds each fallback once", () => {
    const fonts = withFallbacks([libraryFont("Anton"), libraryFont("Bebas Neue"), libraryFont("Oswald")]);
    expect(fonts.map((font) => font.id)).toEqual(["anton", "oswald", "bebas-neue"]);
  });
});

describe("documentFonts", () => {
  it("loads the style's display face and the brand font", () => {
    const doc = { ...sample, style: "bold-pop" as const };
    expect(documentFonts(doc).map((font) => font.id)).toEqual(["unbounded", "onest"]);
  });

  it("adds the caption serif only when the captions are set in it", () => {
    const editorial = { ...sample, style: "clean-paper" as const, captions: captionsIn("editorial") };
    expect(documentFonts(editorial).map((font) => font.id)).toEqual(["inter", "onest", "playfair-display"]);
  });

  it("takes the brand font from the library with its fallback", () => {
    const doc = { ...sample, style: "clean-paper" as const, brand: { ...sample.brand, font: "Bebas Neue" } };
    expect(documentFonts(doc).map((font) => font.id)).toEqual(["inter", "bebas-neue", "oswald"]);
  });
});

function captionsIn(style: "editorial") {
  if (!sample.captions) throw new Error("The sample document has captions");
  return { ...sample.captions, style };
}
