import { createTikTokStyleCaptions } from "@remotion/captions";
import type { TranscriptWord } from "../schema/transcript";
import type { CaptionPage } from "../schema/video";

export function captionPages(
  words: TranscriptWord[],
  combineWithinMs = 1200,
): CaptionPage[] {
  const { pages } = createTikTokStyleCaptions({
    captions: words.map((word) => ({
      text: ` ${word.text}`,
      startMs: word.startMs,
      endMs: word.endMs,
      timestampMs: null,
      confidence: null,
    })),
    combineTokensWithinMilliseconds: combineWithinMs,
    breakOnSilenceAfterMilliseconds: combineWithinMs,
  });
  return pages.map((page) => ({
    text: page.text,
    startMs: page.startMs,
    durationMs: page.durationMs,
    tokens: page.tokens.map((token) => ({
      text: token.text,
      fromMs: token.fromMs,
      toMs: token.toMs,
    })),
  }));
}
