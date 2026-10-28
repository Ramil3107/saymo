import type { TranscriptWord } from "../schema/transcript";

type FootageWindow = { fromMs: number; toMs: number };

export function rebaseWords(
  words: TranscriptWord[],
  footage: FootageWindow,
  sceneStartMs: number,
): TranscriptWord[] {
  const shift = sceneStartMs - footage.fromMs;

  return words
    .filter((word) => word.startMs >= footage.fromMs && word.endMs <= footage.toMs)
    .map((word) => ({ ...word, startMs: word.startMs + shift, endMs: word.endMs + shift }));
}
