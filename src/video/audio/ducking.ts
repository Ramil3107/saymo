import type { TranscriptWord } from "../schema/transcript";

type Interval = { startMs: number; endMs: number };

export function speechIntervals(
  words: TranscriptWord[],
  gapMs = 300,
): Interval[] {
  const intervals: Interval[] = [];
  for (const word of [...words].sort((a, b) => a.startMs - b.startMs)) {
    const last = intervals.at(-1);
    if (last && word.startMs - last.endMs <= gapMs)
      last.endMs = Math.max(last.endMs, word.endMs);
    else intervals.push({ startMs: word.startMs, endMs: word.endMs });
  }
  return intervals;
}

export function musicVolumeAt(
  ms: number,
  speech: Interval[],
  base = 0.9,
  duckTo = 0.25,
  rampMs = 200,
): number {
  let volume = base;
  for (const interval of speech) {
    if (ms >= interval.startMs && ms <= interval.endMs) return duckTo;
    const before = interval.startMs - ms;
    const after = ms - interval.endMs;
    if (before > 0 && before < rampMs)
      volume = Math.min(volume, duckTo + (base - duckTo) * (before / rampMs));
    if (after > 0 && after < rampMs)
      volume = Math.min(volume, duckTo + (base - duckTo) * (after / rampMs));
  }
  return volume;
}
