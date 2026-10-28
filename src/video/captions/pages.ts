import { type Caption, createTikTokStyleCaptions, type TikTokPage } from "@remotion/captions";
import type { TranscriptWord } from "../schema/transcript";
import type { CaptionPage } from "../schema/video";

const defaultCombineWithinMs = 1200;

export function captionPages(
  words: TranscriptWord[],
  combineWithinMs = defaultCombineWithinMs,
): CaptionPage[] {
  const { pages } = createTikTokStyleCaptions({
    captions: words.map(toCaption),
    combineTokensWithinMilliseconds: combineWithinMs,
    breakOnSilenceAfterMilliseconds: combineWithinMs,
  });

  return pages.map(toCaptionPage);
}

function toCaption(word: TranscriptWord): Caption {
  return {
    text: ` ${word.text}`,
    startMs: word.startMs,
    endMs: word.endMs,
    timestampMs: null,
    confidence: null,
  };
}

function toCaptionPage(page: TikTokPage): CaptionPage {
  return {
    text: page.text,
    startMs: page.startMs,
    durationMs: page.durationMs,
    tokens: page.tokens.map((token) => ({ text: token.text, fromMs: token.fromMs, toMs: token.toMs })),
  };
}
