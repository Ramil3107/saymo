import type { CaptionPage } from "../schema/video";

export type Window = { startMs: number; endMs: number };

// Captions give way to a title: a page that starts while a title is up is dropped, a page running into one is cut short.
export function stepAside(pages: CaptionPage[], titles: Window[]): CaptionPage[] {
  return pages.flatMap((page) => {
    const endMs = page.startMs + page.durationMs;
    if (titles.some((title) => page.startMs >= title.startMs && page.startMs < title.endMs)) return [];

    const cutMs = Math.min(
      endMs,
      ...titles.filter((title) => title.startMs > page.startMs).map((title) => title.startMs),
    );
    if (cutMs >= endMs) return [page];

    return [
      {
        ...page,
        durationMs: cutMs - page.startMs,
        tokens: page.tokens.filter((token) => token.fromMs < cutMs),
      },
    ];
  });
}
