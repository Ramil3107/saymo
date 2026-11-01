import { expect, test } from "vitest";
import sampleContent from "../../../../../fixtures/content.sample.json" with { type: "json" };
import { ContentMapSchema } from "../../../../video/schema/content";
import { directorSystemPrompt, directorUserMessage } from "../prompts";

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

test("the system prompt lists every style with its captions and transitions", () => {
  const prompt = directorSystemPrompt();
  expect(prompt).toContain("bold-pop:");
  expect(prompt).toContain("clean-paper:");
  expect(prompt).toContain("transitions wipe, dip, zoom, cut");
  expect(prompt).toContain("counter (value is the number");
  expect(prompt).toContain("accents celebrate as sparkles, frame as selection");
});

test("a brief without a brand asks for a palette, and the system prompt lists them per style", () => {
  expect(directorUserMessage({ mode: "text", destination: "reels", text: "A sale" })).toContain(
    "Brand: none, pick a palette",
  );
  expect(directorSystemPrompt()).toContain("terracotta: burnt clay");
  expect(directorSystemPrompt()).toContain("palettes cobalt, ocean, forest, terracotta, plum");
});
