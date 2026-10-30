import { expect, test } from "vitest";
import { estimateTextWidth } from "../../layout/textWidth";
import { captionGap, popScale, tokenStyle } from "../primitives/captionStyle";

const theme = {
  brand: { colors: ["#2D4BFF", "#FFD23F"], font: "Onest" },
  register: undefined as never,
  fontFamily: "Onest",
};

test("the pop gap leaves room for a long word to grow without touching its neighbours", () => {
  const fontSize = 36;
  const longWord = "в".repeat(20);
  const growthPerSidePx = (estimateTextWidth(longWord, fontSize) * (popScale - 1)) / 2;

  expect(captionGap("pop", fontSize)).toBeGreaterThanOrEqual(growthPerSidePx);
});

test("only the active pop token is scaled", () => {
  expect(tokenStyle("pop", true, theme, 36).transform).toBe(`scale(${popScale})`);
  expect(tokenStyle("pop", false, theme, 36).transform).toBe("none");
});
