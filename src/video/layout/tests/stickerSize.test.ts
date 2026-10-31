import { expect, test } from "vitest";
import { stickerSize } from "../stickerSize";

const plain = { labelScale: 1, widthScale: 1 };

test("stickerSize grows with the text and the face, within the frame", () => {
  const short = stickerSize("New", "9:16", plain);
  const long = stickerSize("Rainbow Sprinkle", "9:16", plain);
  const wide = stickerSize("Rainbow Sprinkle", "9:16", { labelScale: 0.85, widthScale: 1.55 });

  expect(long.w).toBeGreaterThan(short.w);
  expect(wide.w).toBeGreaterThan(long.w);
  expect(stickerSize("A very long sticker that would never fit on one line", "9:16", plain).w).toBe(0.7);
  expect(short.h).toBe(0.08);
});
