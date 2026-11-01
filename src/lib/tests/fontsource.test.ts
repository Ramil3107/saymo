import { describe, expect, it } from "vitest";
import { LibraryFontSchema } from "../../video/fonts/manifest";
import { downloads, type FontsourceFamily, libraryEntry, licenseUrl } from "../fontsource";

const ranges = { latin: "U+0000-00FF", cyrillic: "U+0400-045F", "latin-ext": "U+0100-02BA" };

const playfair: FontsourceFamily = {
  font: {
    id: "playfair-display",
    family: "Playfair Display",
    subsets: ["cyrillic", "latin", "latin-ext", "vietnamese"],
    weights: [400, 500, 600, 700, 800, 900],
    styles: ["italic", "normal"],
    variable: true,
    license: "OFL-1.1",
    version: "v37",
    npmVersion: "5.2.8",
    unicodeRange: ranges,
  },
  weightRange: { min: 400, max: 900 },
};

const anton: FontsourceFamily = {
  font: {
    id: "anton",
    family: "Anton",
    subsets: ["latin", "latin-ext", "vietnamese"],
    weights: [400],
    styles: ["normal"],
    variable: false,
    license: "OFL-1.1",
    version: "v25",
    npmVersion: "5.2.6",
    unicodeRange: ranges,
  },
};

describe("downloads", () => {
  it("takes one variable file per subset and style, Latin and Cyrillic only", () => {
    const files = downloads(playfair);

    expect(files.map((file) => file.path)).toEqual([
      "playfair-display/latin-italic.woff2",
      "playfair-display/cyrillic-italic.woff2",
      "playfair-display/latin-normal.woff2",
      "playfair-display/cyrillic-normal.woff2",
    ]);
    expect(files[0]).toMatchObject({ weight: "400 900", unicodeRange: ranges.latin });
    expect(files[0]?.url).toBe(
      "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display:vf@latest/latin-wght-italic.woff2",
    );
  });

  it("takes one file per weight of a static family", () => {
    const files = downloads(anton);

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ path: "anton/latin-400-normal.woff2", weight: "400", subset: "latin" });
  });
});

describe("libraryEntry", () => {
  it("describes a variable family by the hundreds its weight axis covers", () => {
    const entry = entryOf(playfair, undefined);

    expect(entry.weights).toEqual([400, 500, 600, 700, 800, 900]);
    expect(entry.subsets).toEqual(["latin", "cyrillic"]);
    expect(entry.files[0]).not.toHaveProperty("url");
    expect(LibraryFontSchema.safeParse(entry).success).toBe(true);
  });

  it("refuses a Latin-only face without a fallback", () => {
    expect(LibraryFontSchema.safeParse(entryOf(anton, undefined)).success).toBe(false);
    expect(LibraryFontSchema.safeParse(entryOf(anton, "oswald")).success).toBe(true);
  });
});

describe("licenseUrl", () => {
  it("points at the license of the package version the files come from", () => {
    expect(licenseUrl(anton)).toBe("https://cdn.jsdelivr.net/npm/@fontsource/anton@5.2.6/LICENSE");
  });
});

function entryOf(family: FontsourceFamily, fallback: string | undefined) {
  const licenseFile = `${family.font.id}/OFL.txt`;
  return libraryEntry({ family, kind: "serif", fallback, downloads: downloads(family), licenseFile });
}
