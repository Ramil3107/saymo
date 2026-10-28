import { expect, test } from "vitest";
import { wordsFromAlignment } from "../elevenlabsVoice";

test("wordsFromAlignment groups characters into words", () => {
  const words = wordsFromAlignment({
    characters: ["H", "i", " ", "a", "l", "l"],
    character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
  });
  expect(words).toEqual([
    { text: "Hi", startMs: 0, endMs: 200 },
    { text: "all", startMs: 300, endMs: 600 },
  ]);
});

test("wordsFromAlignment ignores leading, trailing and repeated spaces", () => {
  const words = wordsFromAlignment({
    characters: [" ", "a", " ", " ", "b", " "],
    character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
  });
  expect(words.map((w) => w.text)).toEqual(["a", "b"]);
});
