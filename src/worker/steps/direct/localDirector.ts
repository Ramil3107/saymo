import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { writeJson } from "../../../lib/json";
import { type Plan, PlanSchema } from "../../../video/schema/plan";
import { readAnswer } from "../local";
import { type DirectorInput, directorSystemPrompt, directorUserMessage } from "./prompts";

type Brief = { prompt: string; schema: string; plan: string };

// The brief is exactly what the API would receive, so a plan written from it meets the same contract.
export async function directLocally(input: DirectorInput, folder: string): Promise<Plan> {
  const brief = briefIn(folder);
  await writeBrief(input, brief);

  return readAnswer(brief.plan, PlanSchema, `${brief.prompt} and ${brief.schema}`);
}

function briefIn(folder: string): Brief {
  return {
    prompt: join(folder, "prompt.md"),
    schema: join(folder, "schema.json"),
    plan: join(folder, "plan.json"),
  };
}

async function writeBrief(input: DirectorInput, brief: Brief): Promise<void> {
  const prompt = ["# System prompt", directorSystemPrompt(), "# User message", directorUserMessage(input)];

  await mkdir(dirname(brief.prompt), { recursive: true });
  await writeFile(brief.prompt, `${prompt.join("\n\n")}\n`);
  await writeJson(brief.schema, zodOutputFormat(PlanSchema).schema);
}
