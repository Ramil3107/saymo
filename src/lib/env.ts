import { z } from "zod";

const emptyAsMissing = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const optionalString = emptyAsMissing(z.string().optional());
const stringWithDefault = (fallback: string) => emptyAsMissing(z.string().default(fallback));

const envSchema = z.object({
  ANTHROPIC_API_KEY: optionalString,
  ELEVENLABS_API_KEY: optionalString,
  DEEPGRAM_API_KEY: optionalString,
  AWS_REGION: stringWithDefault("us-east-1"),
  AWS_ACCESS_KEY_ID: optionalString,
  AWS_SECRET_ACCESS_KEY: optionalString,
  REMOTION_AWS_ACCESS_KEY_ID: optionalString,
  REMOTION_AWS_SECRET_ACCESS_KEY: optionalString,
  REMOTION_LAMBDA_FUNCTION_NAME: optionalString,
  REMOTION_SERVE_URL: optionalString,
  SAYMO_DIRECTOR_MODEL: stringWithDefault("claude-opus-5-5"),
  SAYMO_VISION_MODEL: stringWithDefault("claude-sonnet-5-5"),
  SAYMO_VISION_BUDGET_USD: emptyAsMissing(z.coerce.number().default(1)),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(source);
}

export function requireEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (value === undefined) {
    throw new Error(`Set ${key} in .env`);
  }
  return String(value);
}
