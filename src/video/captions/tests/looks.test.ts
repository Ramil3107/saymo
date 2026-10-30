import { describe, expect, it } from "vitest";
import { type CaptionStyle, CaptionStyleSchema } from "../../schema/plan";
import type { TranscriptWord } from "../../schema/transcript";
import { captionLooks, pagesFor, typedLetters, wordPhase } from "../looks";

const words: TranscriptWord[] = "Gluten free diet should never be prescribed just in case"
  .split(" ")
  .map((text, index) => ({
    text,
    startMs: index * 300,
    endMs: index * 300 + 250,
  }));

describe("captionLooks", () => {
  it.each(CaptionStyleSchema.options)("has a look for %s", (style) => {
    expect(captionLooks[style]).toBeDefined();
  });
});

describe("pagesFor", () => {
  const limits: [CaptionStyle, number][] = [
    ["bold-center", 2],
    ["keyword-box", 3],
    ["rail", 4],
  ];

  it.each(limits)("keeps %s pages to %i words", (style, maxWords) => {
    const pages = pagesFor(style, words);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.tokens.length <= maxWords)).toBe(true);
  });

  it("keeps every word once and in order", () => {
    const texts = pagesFor("minimal", words).flatMap((page) => page.tokens.map((token) => token.text.trim()));
    expect(texts).toEqual(words.map((word) => word.text));
  });
});

describe("wordPhase", () => {
  const token = { fromMs: 100, toMs: 400 };

  it("is upcoming, active, then spoken", () => {
    expect(wordPhase(token, 99)).toBe("upcoming");
    expect(wordPhase(token, 100)).toBe("active");
    expect(wordPhase(token, 400)).toBe("spoken");
  });
});

describe("typedLetters", () => {
  const token = { text: "diet", fromMs: 0, toMs: 400 };

  it("types the word over the time it is spoken", () => {
    expect(typedLetters(token, -1)).toBe(0);
    expect(typedLetters(token, 0)).toBe(1);
    expect(typedLetters(token, 250)).toBe(3);
    expect(typedLetters(token, 1000)).toBe(4);
  });
});
