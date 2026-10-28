import { expect, test } from "vitest";
import deepgramFixture from "../../../../fixtures/transcript.deepgram.json" with {
  type: "json",
};
import elevenFixture from "../../../../fixtures/transcript.elevenlabs.json" with {
  type: "json",
};
import { normalizeDeepgram } from "./deepgram";
import { ElevenLabsSttResponseSchema, normalizeElevenLabs } from "./elevenlabs";

test("normalizeElevenLabs keeps words only and converts to ms", () => {
  const t = normalizeElevenLabs(
    ElevenLabsSttResponseSchema.parse(elevenFixture),
  );
  expect(t.words).toHaveLength(10);
  expect(t.words[0]).toEqual({
    text: "Привет",
    startMs: 120,
    endMs: 480,
    speaker: "speaker_0",
  });
  expect(t.language).toBe("ru");
});

test("normalizeDeepgram prefers punctuated words", () => {
  const t = normalizeDeepgram(deepgramFixture);
  expect(t.words[6]?.text).toBe("days.");
  expect(t.words[7]).toEqual({
    text: "That",
    startMs: 2400,
    endMs: 2600,
    speaker: "1",
  });
  expect(t.language).toBe("en");
});
