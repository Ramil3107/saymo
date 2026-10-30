import { describe, expect, it } from "vitest";
import { contrastRatio, luminance, mixHex, readableOn } from "../color";

describe("luminance and contrast", () => {
  it("knows black and white", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#FFFFFF")).toBeCloseTo(1);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21);
  });

  it("returns null for a color it cannot read", () => {
    expect(luminance("red")).toBeNull();
  });
});

describe("mixHex", () => {
  it("moves a color toward another", () => {
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mixHex("#2D4BFF", "#2D4BFF", 0.7)).toBe("#2D4BFF");
  });
});

describe("readableOn", () => {
  it("keeps a color that already reads", () => {
    expect(readableOn("#2D4BFF", "#F6F4EF", 3)).toBe("#2D4BFF");
  });

  it("darkens a light brand yellow until it reads on paper", () => {
    const readable = readableOn("#FFD23F", "#F6F4EF", 3);
    expect(readable).not.toBe("#FFD23F");
    expect(contrastRatio(readable, "#F6F4EF")).toBeGreaterThanOrEqual(3);
  });
});
