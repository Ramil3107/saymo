import { describe, expect, it } from "vitest";
import { tempos } from "../../motion/tempo";
import { entranceEndMs, lineCues, splitWords, type TitleLine } from "../schedule";

const { snap, glide } = tempos;
const lines: TitleLine[] = [
  { text: "Your clinic,", size: "m", tone: "ink", align: "left" },
  { text: "fully booked", size: "l", tone: "accent", align: "center" },
];

describe("lineCues", () => {
  it("types the second line after every letter of the first", () => {
    const cues = lineCues(lines, "type", 100, snap);
    expect(cues[1]?.atMs).toBe(100 + "Your clinic, ".length * snap.letterMs);
  });

  it("staggers rising words across lines one word step apart", () => {
    const words = lineCues(lines, "rise", 0, glide).flatMap((line) => line.words.map((word) => word.atMs));
    expect(words).toEqual([0, 1, 2, 3].map((index) => index * glide.wordMs));
  });

  it("starts every word of a punched line together", () => {
    const second = lineCues(lines, "punch", 0, snap)[1];
    expect(second?.words.map((word) => word.atMs)).toEqual([snap.wordMs, snap.wordMs]);
  });
});

describe("entranceEndMs", () => {
  it("ends a typed title on its last letter", () => {
    const typed = "Your clinic, fully booked".length;
    expect(entranceEndMs(lines, "type", 0, snap)).toBe(typed * snap.letterMs);
  });

  it("takes longer in glide than in snap", () => {
    expect(entranceEndMs(lines, "spread", 0, glide)).toBeGreaterThan(entranceEndMs(lines, "spread", 0, snap));
  });

  it("returns the start for an empty title", () => {
    expect(entranceEndMs([], "pop", 500, snap)).toBe(500);
  });
});

describe("splitWords", () => {
  it("ignores repeated spaces", () => {
    expect(splitWords("  On   the beat ")).toEqual(["On", "the", "beat"]);
  });
});
