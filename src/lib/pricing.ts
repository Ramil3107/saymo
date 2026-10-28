type ClaudeUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

type PerMillion = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
};

const claudePerMillion: Record<string, PerMillion> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": {
    input: 2,
    output: 10,
    cacheRead: 0.2,
    cacheWrite: 2.5,
  },
  "claude-haiku-5-5": {
    input: 0.1,
    output: 0.5,
    cacheRead: 0.01,
    cacheWrite: 0.125,
  },
};

export function assertPricedModel(model: string): void {
  if (!claudePerMillion[model]) throw new Error(`No price for model ${model}`);
}

export function claudeUsd(model: string, usage: ClaudeUsage): number {
  const price = claudePerMillion[model];
  if (!price) throw new Error(`No price for model ${model}`);
  const tokens = {
    input: usage.input_tokens,
    output: usage.output_tokens,
    cacheRead: usage.cache_read_input_tokens ?? 0,
    cacheWrite: usage.cache_creation_input_tokens ?? 0,
  };
  return (
    (tokens.input * price.input +
      tokens.output * price.output +
      tokens.cacheRead * price.cacheRead +
      tokens.cacheWrite * price.cacheWrite) /
    1e6
  );
}

export const ELEVENLABS_STT_USD_PER_MIN = 0.0067;
export const DEEPGRAM_USD_PER_MIN = 0.0077;
export const ELEVENLABS_TTS_USD_PER_1K_CHARS = 0.3;
export const REKOGNITION_USD_PER_IMAGE = 0.001;

export const pricingNotes = {
  claude: { note: "list prices per million tokens, October 2026" },
  elevenLabsStt: { note: "estimate, check the dashboard" },
  deepgram: { note: "estimate, check the dashboard" },
  elevenLabsTts: { note: "estimate, check the dashboard" },
  rekognition: { note: "estimate, check the dashboard" },
} as const;
