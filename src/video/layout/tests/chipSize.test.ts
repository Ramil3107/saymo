import { expect, test } from "vitest";
import { OverlaySchema } from "../../schema/plan";
import { chipLines, chipSize, type LabelFace } from "../chipSize";

const plain: LabelFace = { labelScale: 1, widthScale: 1 };

test("chipSize grows with the text and wraps long text onto a second line", () => {
  const short = chipSize("нудота", undefined, "9:16", plain);
  const long = chipSize("порушення випорожнень шлунку", undefined, "9:16", plain);

  expect(long.w).toBeGreaterThan(short.w);
  expect(long.h).toBeCloseTo(short.h * 2 - short.h * 0.35, 1);
  expect(short.h).toBeLessThan(0.05);
});

test("chipSize leaves room for a badge", () => {
  expect(chipSize("залізо", "Fe", "9:16", plain).w).toBeGreaterThan(
    chipSize("залізо", undefined, "9:16", plain).w,
  );
});

test("chipSize widens a chip for a wider display face and shrinks it for a smaller label", () => {
  const base = chipSize("Motion", undefined, "9:16", plain);
  const wide = chipSize("Motion", undefined, "9:16", { labelScale: 1, widthScale: 1.55 });
  const small = chipSize("Motion", undefined, "9:16", { labelScale: 0.85, widthScale: 1 });

  expect(wide.w).toBeGreaterThan(base.w * 1.3);
  expect(wide.h).toBe(base.h);
  expect(small.h).toBeLessThan(base.h);
});

test("an overlay may carry a badge", () => {
  const overlay = OverlaySchema.parse({
    id: "o1",
    kind: "chip",
    text: "залізо",
    badge: "Fe",
    atMs: 0,
    durationMs: 1000,
  });
  expect(overlay.badge).toBe("Fe");
});

test("chipLines reads one line from a one-line chip and two from a wrapped one", () => {
  const fontPx = 40;
  expect(chipLines(fontPx * (1.12 + 0.7), fontPx)).toBe(1);
  expect(chipLines(fontPx * (2.24 + 0.7), fontPx)).toBe(2);
});
