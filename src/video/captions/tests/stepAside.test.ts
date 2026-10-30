import { describe, expect, it } from "vitest";
import type { CaptionPage } from "../../schema/video";
import { stepAside } from "../stepAside";

function page(startMs: number, durationMs: number): CaptionPage {
  return {
    text: "a b",
    startMs,
    durationMs,
    tokens: [
      { text: "a", fromMs: startMs, toMs: startMs + durationMs / 2 },
      { text: "b", fromMs: startMs + durationMs / 2, toMs: startMs + durationMs },
    ],
  };
}

describe("stepAside", () => {
  const title = { startMs: 1000, endMs: 2000 };

  it("keeps pages away from any title", () => {
    expect(stepAside([page(0, 800), page(2000, 500)], [title])).toEqual([page(0, 800), page(2000, 500)]);
  });

  it("drops a page that starts while a title is up", () => {
    expect(stepAside([page(1200, 600)], [title])).toEqual([]);
  });

  it("cuts a page short where a title begins and drops its later words", () => {
    const [cut] = stepAside([page(600, 800)], [title]);
    expect(cut?.durationMs).toBe(400);
    expect(cut?.tokens.map((token) => token.text)).toEqual(["a"]);
  });
});
