import type Anthropic from "@anthropic-ai/sdk";
import { expect, test } from "vitest";
import textPlan from "../../../../fixtures/plan.text.json" with {
  type: "json",
};
import { Metrics } from "../../../lib/metrics";
import { direct } from "./director";

function fakeClaude(texts: string[]): Anthropic {
  const queue = [...texts];
  const create = async () => ({
    content: [{ type: "text", text: queue.shift() ?? "" }],
    stop_reason: "end_turn",
    usage: { input_tokens: 1000, output_tokens: 500 },
  });
  return { beta: { messages: { create } } } as unknown as Anthropic;
}

test("direct retries once on a schema error and records metrics", async () => {
  const metrics = new Metrics();
  const client = fakeClaude([
    JSON.stringify({ title: "broken" }),
    JSON.stringify(textPlan),
  ]);
  const plan = await direct(
    { mode: "text", destination: "reels", text: "Reports now export to PDF" },
    { client, model: "claude-opus-5-5", metrics },
  );
  expect(plan.beats.length).toBeGreaterThan(0);
  expect(metrics.byStep().direct?.usd).toBeGreaterThan(0);
  expect(metrics.toJSON()).toHaveLength(2);
});

test("direct gives up after the second invalid plan", async () => {
  const client = fakeClaude(["{}", "{}"]);
  await expect(
    direct(
      { mode: "text", destination: "reels", text: "x" },
      { client, model: "claude-opus-5-5", metrics: new Metrics() },
    ),
  ).rejects.toThrow("Director returned an invalid plan");
});
