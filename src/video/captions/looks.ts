import type { CaptionStyle } from "../schema/plan";
import type { TranscriptWord } from "../schema/transcript";
import type { CaptionPage } from "../schema/video";
import { captionPages } from "./pages";
import { railPages } from "./rail";

export type Chunk = "word" | "short" | "phrase" | "line";
export type LetterCase = "upper" | "sentence" | "lower";
export type CaptionSize = "s" | "m" | "l" | "xl";
export type CaptionPlace = "bottom" | "middle";
export type WordEnter = "pop" | "rise" | "fade" | "type" | "weight" | "fill" | "none";
export type Upcoming = "absent" | "hidden" | "dim" | "shown";
export type ActiveMark = "none" | "color" | "pill" | "scale";
export type KeywordMark = "color" | "box" | "marker" | "italic" | "none";
export type Backing = "shadow" | "scrim" | "dark-pill" | "light-pill";
export type CaptionFont = "brand" | "serif";

export type CaptionLook = {
  chunk: Chunk;
  letterCase: LetterCase;
  weight: number;
  size: CaptionSize;
  place: CaptionPlace;
  enter: WordEnter;
  upcoming: Upcoming;
  active: ActiveMark;
  keyword: KeywordMark;
  backing: Backing;
  font: CaptionFont;
};

const base: CaptionLook = {
  chunk: "phrase",
  letterCase: "sentence",
  weight: 800,
  size: "m",
  place: "bottom",
  enter: "none",
  upcoming: "shown",
  active: "none",
  keyword: "color",
  backing: "shadow",
  font: "brand",
};

export const captionLooks: Record<CaptionStyle, CaptionLook> = {
  rail: { ...base, enter: "rise", upcoming: "dim", backing: "scrim" },
  "keyword-box": {
    ...base,
    chunk: "short",
    letterCase: "upper",
    weight: 900,
    size: "l",
    enter: "pop",
    upcoming: "hidden",
    keyword: "box",
    backing: "scrim",
  },
  karaoke: { ...base, chunk: "line", active: "color", keyword: "none" },
  "karaoke-pill": { ...base, chunk: "line", weight: 700, active: "pill", keyword: "none" },
  box: { ...base, chunk: "line", weight: 700, enter: "fade", backing: "dark-pill" },
  pop: {
    ...base,
    chunk: "short",
    letterCase: "upper",
    weight: 900,
    size: "l",
    enter: "pop",
    upcoming: "hidden",
    active: "scale",
  },
  "bold-center": {
    ...base,
    chunk: "word",
    letterCase: "upper",
    weight: 900,
    size: "xl",
    place: "middle",
    enter: "pop",
    upcoming: "hidden",
  },
  minimal: {
    ...base,
    chunk: "line",
    letterCase: "lower",
    weight: 500,
    size: "s",
    enter: "fade",
    upcoming: "hidden",
    keyword: "none",
  },
  "weight-shift": { ...base, weight: 900, enter: "weight", backing: "scrim" },
  marker: { ...base, enter: "rise", upcoming: "hidden", keyword: "marker" },
  typewriter: {
    ...base,
    chunk: "line",
    weight: 600,
    enter: "type",
    upcoming: "absent",
    keyword: "none",
    backing: "light-pill",
  },
  editorial: {
    ...base,
    chunk: "line",
    weight: 500,
    enter: "fade",
    upcoming: "hidden",
    keyword: "italic",
    backing: "scrim",
    font: "serif",
  },
  outline: { ...base, chunk: "short", letterCase: "upper", weight: 900, size: "l", enter: "fill" },
};

const wordChunk = { maxWords: 2, maxSpanMs: 900 };
const shortChunk = { maxWords: 3 };

export function pagesFor(style: CaptionStyle, words: TranscriptWord[]): CaptionPage[] {
  switch (captionLooks[style].chunk) {
    case "word":
      return railPages(words, wordChunk);
    case "short":
      return railPages(words, shortChunk);
    case "phrase":
      return railPages(words);
    case "line":
      return captionPages(words);
  }
}

export function wordPhase(
  token: { fromMs: number; toMs: number },
  ms: number,
): "upcoming" | "active" | "spoken" {
  if (ms < token.fromMs) return "upcoming";
  return ms < token.toMs ? "active" : "spoken";
}

export function typedLetters(token: { text: string; fromMs: number; toMs: number }, ms: number): number {
  if (ms < token.fromMs) return 0;

  const perLetterMs = Math.max(1, (token.toMs - token.fromMs) / Math.max(1, token.text.length));
  return Math.min(token.text.length, Math.floor((ms - token.fromMs) / perLetterMs) + 1);
}
