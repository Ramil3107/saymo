import { z } from "zod";

const MIN_AUTH_SECRET_LENGTH = 32;

const emptyAsMissing = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const optionalString = emptyAsMissing(z.string().optional());

export const DatabaseEnvSchema = z.object({ DATABASE_URL: z.url() });

export const AppEnvSchema = z
  .object({
    ...DatabaseEnvSchema.shape,
    BETTER_AUTH_SECRET: z.string().min(MIN_AUTH_SECRET_LENGTH),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    SMTP_URL: emptyAsMissing(z.url().default("smtp://127.0.0.1:1025")),
    EMAIL_FROM: emptyAsMissing(z.string().default("Saymo <hello@saymo.local>")),
  })
  .superRefine((env, context) => {
    const missingKey = missingGoogleKey(env);
    if (missingKey) {
      context.addIssue({ code: "custom", path: [missingKey], message: `Set ${missingKey} too` });
    }
  });

export type AppEnv = z.infer<typeof AppEnvSchema>;

let cached: AppEnv | undefined;

export function loadAppEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  return AppEnvSchema.parse(source);
}

export function databaseUrl(source: Record<string, string | undefined> = process.env): string {
  return DatabaseEnvSchema.parse(source).DATABASE_URL;
}

export function appEnv(): AppEnv {
  cached ??= loadAppEnv();
  return cached;
}

export function googleSignIn(env: AppEnv): { clientId: string; clientSecret: string } | undefined {
  if (env.GOOGLE_CLIENT_ID === undefined || env.GOOGLE_CLIENT_SECRET === undefined) {
    return undefined;
  }
  return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
}

function missingGoogleKey(env: {
  GOOGLE_CLIENT_ID?: string | undefined;
  GOOGLE_CLIENT_SECRET?: string | undefined;
}): "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | undefined {
  const hasId = env.GOOGLE_CLIENT_ID !== undefined;
  const hasSecret = env.GOOGLE_CLIENT_SECRET !== undefined;
  if (hasId && !hasSecret) return "GOOGLE_CLIENT_SECRET";
  if (hasSecret && !hasId) return "GOOGLE_CLIENT_ID";
  return undefined;
}
