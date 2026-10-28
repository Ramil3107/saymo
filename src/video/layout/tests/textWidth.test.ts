import { expect, test } from "vitest";
import { estimateTextWidth, fitsInBox } from "../textWidth";

test("estimateTextWidth is wider for cyrillic", () => {
  expect(estimateTextWidth("Привет", 72)).toBeGreaterThan(estimateTextWidth("Hello!", 72));
});

test("estimateTextWidth counts spaces as narrow", () => {
  expect(estimateTextWidth("a b", 100)).toBeCloseTo(58 + 30 + 58, 6);
});

test("fitsInBox allows two lines and rejects a wall of text", () => {
  const box = { x: 0.1, y: 0.1, w: 0.6888, h: 0.18 };
  expect(fitsInBox("Reports, now in PDF", box, "9:16", 2, 72)).toBe(true);
  expect(
    fitsInBox("Reports now export to PDF in one click for every single team member", box, "9:16", 2, 72),
  ).toBe(false);
});
