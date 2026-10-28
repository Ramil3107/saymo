type ClaudeUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

type PricePerMillion = { input: number; output: number; cacheRead: number; cacheWrite: number };

const claudePrices: Record<string, PricePerMillion> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export const ELEVENLABS_STT_USD_PER_MIN = 0.0067;
export const DEEPGRAM_USD_PER_MIN = 0.0077;
export const ELEVENLABS_TTS_USD_PER_1K_CHARS = 0.3;
export const REKOGNITION_USD_PER_IMAGE = 0.001;

export const pricingNotes = {
  claude: "list prices per million tokens, October 2026",
  elevenLabsStt: "estimate, check the dashboard",
  deepgram: "estimate, check the dashboard",
  elevenLabsTts: "estimate, check the dashboard",
  rekognition: "estimate, check the dashboard",
} as const;

export function assertPricedModel(model: string): void {
  if (!claudePrices[model]) throw new Error(`No price for model ${model}`);
}

export function claudeUsd(model: string, usage: ClaudeUsage): number {
  const price = claudePrices[model];
  if (!price) throw new Error(`No price for model ${model}`);

  const cost =
    usage.input_tokens * price.input +
    usage.output_tokens * price.output +
    (usage.cache_read_input_tokens ?? 0) * price.cacheRead +
    (usage.cache_creation_input_tokens ?? 0) * price.cacheWrite;

  return cost / 1e6;
}
