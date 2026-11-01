import { describe, expect, it } from "vitest";
import { palettes } from "../palettes";
import { contrastRatio, luminance } from "../style/color";
import { brandPalette, fieldColors } from "../style/palette";
import { styles } from "../styles";

const lightLuminance = 0.5;
const fieldTones = ["accent", "ink", "highlight", "alt", "surface"] as const;

describe.each(Object.entries(styles))("the %s palettes", (_, style) => {
  it.each(style.palettes)("read %s like a brand: a readable accent, a light highlight", (id) => {
    const palette = brandPalette(style.tones, palettes[id].colors);

    expect(contrastRatio(palette.accent, palette.background)).toBeGreaterThanOrEqual(3);
    expect(luminance(palette.highlight) ?? 0).toBeGreaterThan(lightLuminance);
    expect(palette.alt).not.toBe(palette.accent);
  });

  it.each(style.palettes)("keep text readable on every %s field", (id) => {
    const palette = brandPalette(style.tones, palettes[id].colors);

    for (const tone of fieldTones) {
      const colors = fieldColors(palette, tone);
      expect(contrastRatio(colors.ink, colors.background)).toBeGreaterThanOrEqual(3);
    }
  });
});

it("gives every palette to at least one style and each style five or more", () => {
  const offered = new Set(Object.values(styles).flatMap((style) => style.palettes));

  expect([...offered].sort()).toEqual(Object.keys(palettes).sort());
  for (const style of Object.values(styles)) expect(style.palettes.length).toBeGreaterThanOrEqual(5);
});
