import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { writeJson } from "../../../lib/json";
import type { FrameNote } from "../../../video/schema/content";
import { readAnswer } from "../local";
import { describeInstructions, type Frame, FrameNotesSchema } from "./describe";

// Keyframes described outside the run, from the same instructions and schema the API would get.
export async function describeLocally(frames: Frame[], folder: string): Promise<FrameNote[]> {
  const brief = join(folder, "frames.md");
  const schema = join(folder, "schema.json");
  const lines = frames.map((frame) => `- ${frame.tMs} ms: ${frame.path}`);

  await mkdir(folder, { recursive: true });
  await writeFile(brief, `${[describeInstructions(frames), "", ...lines].join("\n")}\n`);
  await writeJson(schema, zodOutputFormat(FrameNotesSchema).schema);

  const notes = await readAnswer(join(folder, "frames.json"), FrameNotesSchema, `${brief} and ${schema}`);
  return notes.frames;
}
