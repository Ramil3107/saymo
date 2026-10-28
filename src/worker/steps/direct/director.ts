import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { assertNotRefused, textOf, withFallback } from "../../../lib/ai/claude";
import { errorMessage } from "../../../lib/errors";
import { elapsedMs, type Metrics } from "../../../lib/metrics";
import { claudeUsd } from "../../../lib/pricing";
import { type Plan, PlanSchema } from "../../../video/schema/plan";
import { type DirectorInput, directorSystemPrompt, directorUserMessage } from "./prompts";

type Deps = { client: Anthropic; model: string; metrics: Metrics };
type Attempt = { plan: Plan } | { error: string };

const maxTokens = 16000;

export async function direct(input: DirectorInput, deps: Deps): Promise<Plan> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: directorUserMessage(input) }];

  const first = await askDirector(messages, deps);
  const attempt = parsePlan(textOf(first));
  if ("plan" in attempt) return attempt.plan;

  messages.push(
    { role: "assistant", content: first.content },
    { role: "user", content: `The plan failed validation: ${attempt.error}. Return a corrected plan.` },
  );
  const retry = parsePlan(textOf(await askDirector(messages, deps)));
  if ("plan" in retry) return retry.plan;

  throw new Error(`Director returned an invalid plan twice: ${retry.error}`);
}

async function askDirector(
  messages: Anthropic.Beta.BetaMessageParam[],
  deps: Deps,
): Promise<Anthropic.Beta.BetaMessage> {
  const startedAt = performance.now();

  const message = await deps.client.beta.messages.create({
    ...withFallback,
    model: deps.model,
    max_tokens: maxTokens,
    output_config: { effort: "high", format: zodOutputFormat(PlanSchema) },
    system: [{ type: "text", text: directorSystemPrompt(), cache_control: { type: "ephemeral" } }],
    messages,
  });
  assertNotRefused(message);

  deps.metrics.record({
    step: "direct",
    provider: "anthropic",
    ms: elapsedMs(startedAt),
    usd: claudeUsd(deps.model, message.usage),
    detail: {
      model: deps.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  });

  return message;
}

function parsePlan(text: string): Attempt {
  try {
    const result = PlanSchema.safeParse(JSON.parse(text));
    return result.success ? { plan: result.data } : { error: result.error.message };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
