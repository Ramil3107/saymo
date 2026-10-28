import { expect, test } from "vitest";
import { loadEnv, requireEnv } from "./env";

test("defaults apply when variables are missing", () => {
  const env = loadEnv({});
  expect(env.SAYMO_DIRECTOR_MODEL).toBe("claude-opus-5-5");
  expect(env.AWS_REGION).toBe("us-east-1");
  expect(env.SAYMO_VISION_BUDGET_USD).toBe(1);
});

test("empty string counts as missing", () => {
  expect(loadEnv({ ANTHROPIC_API_KEY: "" }).ANTHROPIC_API_KEY).toBeUndefined();
});

test("empty string falls back to the default", () => {
  const env = loadEnv({ AWS_REGION: "", SAYMO_VISION_BUDGET_USD: "" });
  expect(env.AWS_REGION).toBe("us-east-1");
  expect(env.SAYMO_VISION_BUDGET_USD).toBe(1);
});

test("vision budget is parsed from a string", () => {
  const env = loadEnv({ SAYMO_VISION_BUDGET_USD: "2.5" });
  expect(env.SAYMO_VISION_BUDGET_USD).toBe(2.5);
});

test("a budget that is not a number is rejected", () => {
  expect(() => loadEnv({ SAYMO_VISION_BUDGET_USD: "lots" })).toThrow(
    "SAYMO_VISION_BUDGET_USD",
  );
});

test("requireEnv returns the value when it is set", () => {
  const env = loadEnv({ ANTHROPIC_API_KEY: "test-key" });
  expect(requireEnv(env, "ANTHROPIC_API_KEY")).toBe("test-key");
});

test("requireEnv names the missing key", () => {
  expect(() => requireEnv(loadEnv({}), "ANTHROPIC_API_KEY")).toThrow(
    "Set ANTHROPIC_API_KEY in .env",
  );
});
