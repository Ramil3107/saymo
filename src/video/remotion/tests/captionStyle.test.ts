import { expect, test } from "vitest";
import { estimateTextWidth } from "../../layout/textWidth";
import { tempos } from "../../motion/tempo";
import { registers } from "../../registers";
import { captionGap, popScale, tokenStyle } from "../primitives/captionStyle";

const theme = {
  brand: { colors: ["#2D4BFF", "#FFD23F"], font: "Onest" },
  register: registers["serious-clinical"],
  tempo: tempos.glide,
  fontFamily: "Onest",
  safeZone: { top: 0.14, bottom: 0.22, left: 0.04, right: 0.14 },
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
