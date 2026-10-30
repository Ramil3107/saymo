import { enterMs } from "../motion/moves";
import type { Tempo } from "../motion/tempo";

export type TitleEntrance = "type" | "rise" | "pop" | "spread" | "punch" | "reveal";

export type TitleSize = "xl" | "l" | "m" | "s";

export type Tone = "ink" | "accent" | "alt";

export type Align = "left" | "center" | "right";

export type TitleLine = { text: string; size: TitleSize; tone: Tone; align: Align; marked?: boolean };

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
