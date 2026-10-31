import { z } from "zod";
import { enterMs } from "../motion/moves";
import type { Tempo } from "../motion/tempo";

export const TitleEntranceSchema = z.enum(["type", "rise", "pop", "spread", "punch", "reveal"]);

export type TitleEntrance = z.infer<typeof TitleEntranceSchema>;

export const TitleLineSchema = z.object({
  text: z.string(),
  size: z.enum(["xl", "l", "m", "s"]),
  tone: z.enum(["ink", "accent", "alt"]),
  align: z.enum(["left", "center", "right"]),
  marked: z.boolean().optional(),
});

export type TitleLine = z.infer<typeof TitleLineSchema>;

export type TitleSize = TitleLine["size"];

// A title line's largest font size as a share of the title's width; lines are set at this line height.
export const titleSizeShare: Record<TitleSize, number> = { xl: 0.22, l: 0.15, m: 0.095, s: 0.06 };
export const titleLineHeight = 1.04;

export type Tone = TitleLine["tone"];

export type Align = TitleLine["align"];

export type LineCue = { atMs: number; words: { text: string; atMs: number }[] };

const spreadLength = 2.5;

export function lineCues(lines: TitleLine[], entrance: TitleEntrance, atMs: number, tempo: Tempo): LineCue[] {
  let lettersBefore = 0;
  let wordsBefore = 0;

  return lines.map((line, lineIndex) => {
    const words = splitWords(line.text).map((text, wordIndex) => {
      const atWord = wordAtMs(entrance, tempo, {
        atMs,
        lineIndex,
        lettersBefore,
        wordsBefore: wordsBefore + wordIndex,
      });
      lettersBefore += text.length + 1;
      return { text, atMs: atWord };
    });
    wordsBefore += words.length;
    return { atMs: words[0]?.atMs ?? atMs, words };
  });
}

export function entranceEndMs(
  lines: TitleLine[],
  entrance: TitleEntrance,
  atMs: number,
  tempo: Tempo,
): number {
  const cues = lineCues(lines, entrance, atMs, tempo);
  const lastWord = cues.at(-1)?.words.at(-1);
  if (!lastWord) return atMs;

  if (entrance === "type") return lastWord.atMs + lastWord.text.length * tempo.letterMs;
  return lastWord.atMs + entranceMs(entrance, tempo);
}

export function entranceMs(entrance: TitleEntrance, tempo: Tempo): number {
  switch (entrance) {
    case "type":
      return tempo.letterMs;
    case "spread":
      return Math.round(tempo.moveMs * spreadLength);
    case "rise":
    case "pop":
    case "punch":
    case "reveal":
      return enterMs(entrance, tempo);
  }
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word !== "");
}

function wordAtMs(
  entrance: TitleEntrance,
  tempo: Tempo,
  place: { atMs: number; lineIndex: number; lettersBefore: number; wordsBefore: number },
): number {
  switch (entrance) {
    case "type":
      return place.atMs + place.lettersBefore * tempo.letterMs;
    case "rise":
    case "pop":
      return place.atMs + place.wordsBefore * tempo.wordMs;
    case "spread":
    case "punch":
    case "reveal":
      return place.atMs + place.lineIndex * tempo.wordMs;
  }
}
