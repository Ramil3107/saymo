import { expect, it } from "vitest";
import { styleKit } from "../kit";

const brand = { colors: ["#2D4BFF", "#FFD23F"], font: "Onest" };

it("draws the style's first backdrop when the document names none or one the style lacks", () => {
  expect(styleKit("bold-pop", brand).backdrop).toBe("glow");
  expect(styleKit("clean-paper", brand, "pills").backdrop).toBe("paper-grid");
  expect(styleKit("clean-paper", brand, "night").backdrop).toBe("night");
});

it("dips through the ground of a color or dark backdrop, otherwise through the style's panel tone", () => {
  const night = styleKit("clean-paper", brand, "night");
  const color = styleKit("bold-pop", brand, "color");
  const paper = styleKit("clean-paper", brand);
  const glow = styleKit("bold-pop", brand);

  expect(night.transition.dip).toBe(night.palette.ink);
  expect(color.transition.dip).toBe(color.palette.accent);
  expect(paper.transition.dip).toBe(paper.palette.background);
  expect(glow.transition.dip).toBe(glow.palette.ink);
});
