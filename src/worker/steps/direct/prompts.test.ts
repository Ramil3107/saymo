import { expect, test } from "vitest";
import sampleContent from "../../../../fixtures/content.sample.json" with {
  type: "json",
};
import { ContentMapSchema } from "../../../video/schema/content";
import { directorSystemPrompt, directorUserMessage } from "./prompts";

const content = ContentMapSchema.parse(sampleContent);

test("directorSystemPrompt is stable between calls", () => {
  expect(directorSystemPrompt()).toBe(directorSystemPrompt());
  expect(directorSystemPrompt()).toContain("lower-third");
});

test("directorUserMessage says there is no speech when transcript is empty", () => {
  const silent = {
    ...content,
    transcript: { language: "en", text: "", words: [] },
  };
  expect(
    directorUserMessage({
      mode: "footage",
      destination: "reels",
      content: silent,
    }),
  ).toContain("no speech");
});

test("directorUserMessage renders the transcript with timecodes and the destination cap", () => {
  const message = directorUserMessage({
    mode: "footage",
    destination: "reels",
    content,
  });
  expect(message).toContain("[0:00.4]");
  expect(message).toContain("180000");
  expect(message).toContain("48000");
});

test("directorUserMessage in text mode carries the text and the page", () => {
  const message = directorUserMessage({
    mode: "text",
    destination: "linkedin",
    text: "Reports now export to PDF",
    pageText: "Acme makes reports",
  });
  expect(message).toContain("Reports now export to PDF");
  expect(message).toContain("Acme makes reports");
});
