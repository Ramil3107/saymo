import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { errorMessage } from "../../../lib/errors";
import { writeJson } from "../../../lib/json";
import { type Plan, PlanSchema } from "../../../video/schema/plan";
import { type DirectorInput, directorSystemPrompt, directorUserMessage } from "./prompts";

export class WaitingForPlanError extends Error {}

type Brief = { prompt: string; schema: string; plan: string };

// The director played outside the run: the run writes what the API would receive, stops, and on resume reads
// back the plan written for it.
export async function directLocally(input: DirectorInput, folder: string): Promise<Plan> {
  const brief = briefIn(folder);
  await writeBrief(input, brief);

  if (!existsSync(brief.plan)) {
    throw new WaitingForPlanError(
      `Write ${brief.plan} from ${brief.prompt} and ${brief.schema}, then resume the run.`,
    );
  }

  return readPlan(brief.plan);
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

async function readPlan(path: string): Promise<Plan> {
  const parsed = PlanSchema.safeParse(parseJson(await readFile(path, "utf8")));
  if (!parsed.success) {
    throw new WaitingForPlanError(`${path} is not a valid plan:\n${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new WaitingForPlanError(`The plan is not JSON: ${errorMessage(error)}`);
  }
}
