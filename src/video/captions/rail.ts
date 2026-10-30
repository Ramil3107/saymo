import type { TranscriptWord } from "../schema/transcript";
import type { CaptionPage } from "../schema/video";

export type RailOptions = { maxWords?: number; maxSpanMs?: number; pauseMs?: number; holdMs?: number };

type Settings = Required<RailOptions>;
type Group = { words: TranscriptWord[]; startMs: number; endMs: number };

const defaults: Settings = { maxWords: 4, maxSpanMs: 1800, pauseMs: 600, holdMs: 300 };

// A rail page is a short phrase that stays up until the next phrase starts.
export function railPages(words: TranscriptWord[], options: RailOptions = {}): CaptionPage[] {
  const settings = { ...defaults, ...options };
  const groups = groupWords(words, settings);

  return groups.map((group, index) => toPage(group, groups[index + 1]?.startMs, settings.holdMs));
}

export function isKeyword(text: string, keywords: string[]): boolean {
  const wanted = normalize(text);
  return wanted.length > 0 && keywords.some((keyword) => normalize(keyword) === wanted);
}

function groupWords(words: TranscriptWord[], settings: Settings): Group[] {
  const groups: Group[] = [];
  let open: Group | undefined;

  for (const word of words) {
    if (open && startsNewPage(open, word, settings)) {
      groups.push(open);
      open = undefined;
    }
    open = open ? extend(open, word) : { words: [word], startMs: word.startMs, endMs: word.endMs };
    if (endsSentence(word.text)) {
      groups.push(open);
      open = undefined;
    }
  }
  if (open) groups.push(open);

  return groups;
}

function startsNewPage(open: Group, word: TranscriptWord, settings: Settings): boolean {
  return (
    word.startMs - open.endMs > settings.pauseMs ||
    open.words.length >= settings.maxWords ||
    word.endMs - open.startMs > settings.maxSpanMs
  );
}

function extend(open: Group, word: TranscriptWord): Group {
  return { words: [...open.words, word], startMs: open.startMs, endMs: word.endMs };
}

function toPage(group: Group, nextStartMs: number | undefined, holdMs: number): CaptionPage {
  const endMs = nextStartMs ?? group.endMs + holdMs;

  return {
    text: group.words.map((word) => word.text).join(" "),
    startMs: group.startMs,
    durationMs: endMs - group.startMs,
    tokens: group.words.map((word) => ({ text: word.text, fromMs: word.startMs, toMs: word.endMs })),
  };
}

function endsSentence(text: string): boolean {
  return /[.!?]$/.test(text);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}
