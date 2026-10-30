import { expect, test } from "vitest";
import { isKeyword, railPages } from "../rail";

const word = (text: string, startMs: number, endMs: number) => ({ text, startMs, endMs });

test("railPages ends a page at the end of a sentence", () => {
  const pages = railPages([
    word("Дієта", 0, 400),
    word("сувора.", 500, 900),
    word("Але", 1000, 1200),
    word("не", 1250, 1400),
  ]);
  expect(pages.map((page) => page.text)).toEqual(["Дієта сувора.", "Але не"]);
});

test("railPages holds at most four words per page", () => {
  const words = ["a", "b", "c", "d", "e", "f"].map((text, index) =>
    word(text, index * 300, index * 300 + 200),
  );
  expect(railPages(words).map((page) => page.text)).toEqual(["a b c d", "e f"]);
});

test("railPages breaks on a pause and keeps word timings", () => {
  const pages = railPages([word("раз", 0, 300), word("два", 1200, 1500), word("три", 1600, 1900)]);
  expect(pages.map((page) => page.text)).toEqual(["раз", "два три"]);
  expect(pages[1]?.startMs).toBe(1200);
  expect(pages[1]?.tokens.map((token) => token.fromMs)).toEqual([1200, 1600]);
});

test("railPages lets a page live until the next page starts", () => {
  const pages = railPages([word("раз", 0, 300), word("два", 1200, 1500)]);
  expect(pages[0]?.durationMs).toBe(1200);
  expect(pages[1]?.durationMs).toBeGreaterThanOrEqual(300);
});

test("isKeyword ignores case and punctuation", () => {
  const keywords = ["целіакії", "B12"];
  expect(isKeyword("Целіакії,", keywords)).toBe(true);
  expect(isKeyword("b12", keywords)).toBe(true);
  expect(isKeyword("дієта", keywords)).toBe(false);
});
