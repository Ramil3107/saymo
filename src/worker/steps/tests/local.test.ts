import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { z } from "zod";
import { readAnswer, WaitingError } from "../local";

const AnswerSchema = z.object({ ok: z.boolean() });

test("readAnswer waits for a missing, broken or invalid answer and returns a valid one", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "saymo-local-")), "answer.json");

  await expect(readAnswer(path, AnswerSchema, "the brief")).rejects.toThrow(/the brief/);
  writeFileSync(path, "{ nope");
  await expect(readAnswer(path, AnswerSchema, "the brief")).rejects.toBeInstanceOf(WaitingError);
  writeFileSync(path, JSON.stringify({ ok: "yes" }));
  await expect(readAnswer(path, AnswerSchema, "the brief")).rejects.toThrow(/ok/);
  writeFileSync(path, JSON.stringify({ ok: true }));
  expect(await readAnswer(path, AnswerSchema, "the brief")).toEqual({ ok: true });
});
