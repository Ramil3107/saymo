import { expect, test } from "vitest";
import { Metrics, timed } from "./metrics";
import { claudeUsd } from "./pricing";

test("claudeUsd prices opus 5.5 with cache reads", () => {
  expect(
    claudeUsd("claude-opus-5-5", {
      input_tokens: 1000,
      output_tokens: 500,
      cache_read_input_tokens: 10000,
    }),
  ).toBeCloseTo(0.004 + 0.01 + 0.002, 6);
});

test("claudeUsd rejects an unknown model", () => {
  expect(() =>
    claudeUsd("claude-3", { input_tokens: 1, output_tokens: 1 }),
  ).toThrow("No price for model claude-3");
});

test("Metrics sums by step", () => {
  const metrics = new Metrics();
  metrics.record({ step: "direct", provider: "anthropic", ms: 100, usd: 0.01 });
  metrics.record({ step: "direct", provider: "anthropic", ms: 50, usd: 0.02 });
  metrics.record({ step: "render", provider: "lambda", ms: 700, usd: 0.1 });
  expect(metrics.byStep()).toEqual({
    direct: { ms: 150, usd: 0.03 },
    render: { ms: 700, usd: 0.1 },
  });
  expect(metrics.total()).toEqual({ ms: 850, usd: 0.13 });
  expect(Metrics.from(metrics.toJSON()).total()).toEqual({
    ms: 850,
    usd: 0.13,
  });
});

test("timed records duration and cost of a step", async () => {
  const metrics = new Metrics();
  const value = await timed(metrics, "transcribe", "deepgram", async () => ({
    value: 42,
    usd: 0.5,
  }));
  expect(value).toBe(42);
  expect(metrics.byStep().transcribe?.usd).toBe(0.5);
  expect(metrics.toJSON()[0]?.ms).toBeGreaterThanOrEqual(0);
});

test("Metrics.drop removes the events of one step so a re-run does not double count", () => {
  const metrics = Metrics.from([
    { step: "direct", provider: "anthropic", ms: 100, usd: 0.01 },
    { step: "render", provider: "lambda", ms: 700, usd: 0.1 },
  ]);
  metrics.drop("direct");
  expect(metrics.byStep()).toEqual({ render: { ms: 700, usd: 0.1 } });
});

test("assertPricedModel rejects an unknown model before any call", async () => {
  const { assertPricedModel } = await import("./pricing");
  expect(() => assertPricedModel("claude-3")).toThrow(
    "No price for model claude-3",
  );
  expect(() => assertPricedModel("claude-sonnet-5-5")).not.toThrow();
});
