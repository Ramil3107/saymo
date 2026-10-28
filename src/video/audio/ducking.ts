import type { TranscriptWord } from "../schema/transcript";

type Interval = { startMs: number; endMs: number };

const defaultGapMs = 300;
const defaultBase = 0.9;
const defaultDuckTo = 0.25;
const defaultRampMs = 200;

export function speechIntervals(words: TranscriptWord[], gapMs = defaultGapMs): Interval[] {
  const sorted = [...words].sort((a, b) => a.startMs - b.startMs);
  const intervals: Interval[] = [];

  for (const word of sorted) {
    const last = intervals.at(-1);
    if (last && word.startMs - last.endMs <= gapMs) last.endMs = Math.max(last.endMs, word.endMs);
    else intervals.push({ startMs: word.startMs, endMs: word.endMs });
  }

  return intervals;
}

export function musicVolumeAt(
  ms: number,
  speech: Interval[],
  base = defaultBase,
  duckTo = defaultDuckTo,
  rampMs = defaultRampMs,
): number {
  const nearestSpeechMs = Math.min(...speech.map((interval) => distanceTo(ms, interval)));
  if (nearestSpeechMs >= rampMs) return base;

  return duckTo + (base - duckTo) * (nearestSpeechMs / rampMs);
}

function distanceTo(ms: number, interval: Interval): number {
  if (ms < interval.startMs) return interval.startMs - ms;
  if (ms > interval.endMs) return ms - interval.endMs;
  return 0;
}
