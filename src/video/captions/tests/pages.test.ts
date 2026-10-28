import { expect, test } from "vitest";
import { captionPages } from "../pages";
import { rebaseWords } from "../timeline";

test("rebaseWords shifts footage time to scene time", () => {
  expect(
    rebaseWords([{ text: "a", startMs: 12500, endMs: 12900 }], { fromMs: 12000, toMs: 15000 }, 3000),
  ).toEqual([{ text: "a", startMs: 3500, endMs: 3900 }]);
});

test("rebaseWords drops words outside the footage range", () => {
  const words = [
    { text: "before", startMs: 11000, endMs: 11500 },
    { text: "inside", startMs: 12500, endMs: 12900 },
    { text: "after", startMs: 15100, endMs: 15500 },
  ];
  expect(rebaseWords(words, { fromMs: 12000, toMs: 15000 }, 0).map((w) => w.text)).toEqual(["inside"]);
});

test("captionPages handles cyrillic and groups within 1200 ms", () => {
  const pages = captionPages([
    { text: "Привет", startMs: 0, endMs: 300 },
    { text: "мир", startMs: 400, endMs: 700 },
    { text: "дальше", startMs: 2500, endMs: 2900 },
  ]);
  expect(pages).toHaveLength(2);
  expect(pages[0]?.text.trim()).toBe("Привет мир");
  expect(pages[0]?.tokens[0]?.fromMs).toBe(0);
});
