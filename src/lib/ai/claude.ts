import Anthropic from "@anthropic-ai/sdk";

export const withFallback = {
  betas: ["server-side-fallback-2026-07-01"] as Anthropic.AnthropicBeta[],
  fallbacks: "default" as const,
};

export function createClaude(apiKey?: string): Anthropic {
  return new Anthropic(apiKey ? { apiKey } : {});
}

export function textOf(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function assertNotRefused(message: Anthropic.Beta.BetaMessage): void {
  if (message.stop_reason !== "refusal") return;
  throw new Error(`Claude refused: ${message.stop_details?.category ?? "unknown"}`);
}
