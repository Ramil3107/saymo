import { describe, expect, it } from "vitest";
import { styles } from "../../styles";
import { contrastRatio } from "../color";
import { brandPalette, fieldColors } from "../palette";

const synevo = ["#2D4BFF", "#FFD23F", "#FFFFFF"];

describe("brandPalette", () => {
  it.each(Object.entries(styles))("keeps the %s accent readable on its background", (_, style) => {
    const palette = brandPalette(style.tones, ["#FFE45C"]);
    expect(contrastRatio(palette.accent, palette.background)).toBeGreaterThanOrEqual(3);
  });

  it("takes the accent from the brand and turns a light brand color into the highlight", () => {
    const palette = brandPalette(styles["clean-paper"].tones, synevo);
    expect(palette.accent).toBe("#2D4BFF");
    expect(palette.highlight).toBe("#FFD23F");
  });

  it("deepens the accent for the second tone when the brand has no other dark color", () => {
    const palette = brandPalette(styles["bold-pop"].tones, synevo);
    expect(palette.alt).not.toBe(palette.accent);
    expect(contrastRatio(palette.alt, palette.background)).toBeGreaterThanOrEqual(3);
  });

  it("sets ink text on a light brand accent and white text on a deep one", () => {
    const lime = brandPalette(styles["bold-pop"].tones, ["#C8FF2E"]);
    const cobalt = brandPalette(styles["bold-pop"].tones, ["#2D4BFF"]);

    expect(fieldColors(lime, "accent").ink).toBe(lime.ink);
    expect(fieldColors(cobalt, "accent").ink).toBe("#FFFFFF");
  });

  it("falls back to the style's own tones without brand colors", () => {
    const palette = brandPalette(styles["bold-pop"].tones, []);
    expect(palette.highlight).toBe(styles["bold-pop"].tones.highlight);
    expect(palette.accent).toBe(styles["bold-pop"].tones.ink);
  });
});

describe("fieldColors", () => {
  it.each(Object.entries(styles))("keeps text readable on every %s field", (_, style) => {
    const palette = brandPalette(style.tones, synevo);

    for (const tone of ["accent", "ink", "highlight", "alt"] as const) {
      const colors = fieldColors(palette, tone);
      expect(contrastRatio(colors.ink, colors.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(colors.accent, colors.background)).toBeGreaterThanOrEqual(3);
    }
  });
});
