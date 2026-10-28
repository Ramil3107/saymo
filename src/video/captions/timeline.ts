import type { TranscriptWord } from "../schema/transcript";

export function rebaseWords(
  words: TranscriptWord[],
  footage: { fromMs: number; toMs: number },
  sceneStartMs: number,
): TranscriptWord[] {
  const shift = sceneStartMs - footage.fromMs;
  return words
    .filter(
      (word) => word.startMs >= footage.fromMs && word.endMs <= footage.toMs,
    )
    .map((word) => ({
      ...word,
      startMs: word.startMs + shift,
      endMs: word.endMs + shift,
    }));
}
