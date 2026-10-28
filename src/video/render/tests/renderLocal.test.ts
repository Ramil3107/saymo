import { expect, test } from "vitest";
import sampleDocJson from "../../../../fixtures/video.sample.json" with { type: "json" };
import { VideoDocSchema } from "../../schema/video";
import { posterTimeMs } from "../renderLocal";

const sampleDoc = VideoDocSchema.parse(sampleDocJson);

test("posterTimeMs is the middle of the first scene with a headline", () => {
  expect(posterTimeMs(sampleDoc)).toBe(1000);
});

test("posterTimeMs falls back to the middle of the first scene", () => {
  const noHeadline = { ...sampleDoc, scenes: sampleDoc.scenes.slice(1) };
  expect(posterTimeMs(noHeadline)).toBe(2000 + 4500);
});
