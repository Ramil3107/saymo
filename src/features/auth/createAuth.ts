import { type BetterAuthPlugin, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import type { Database } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

const LINK_LIFETIME_SECONDS = 10 * 60;
const SECONDS_PER_DAY = 24 * 60 * 60;
const SESSION_DAYS = 30;
const LINK_OPEN_RATE_RULE = { window: 60, max: 30 };

export type AuthDeps = {
  db: Database;
  secret: string;
  baseURL: string;
  google?: { clientId: string; clientSecret: string };
  sendSignInLink(to: string, link: { url: string; token: string }): Promise<void>;
  plugins?: BetterAuthPlugin[];
};

export type Auth = ReturnType<typeof createAuth>;

export function createAuth(deps: AuthDeps) {
  return betterAuth({
    database: drizzleAdapter(deps.db, { provider: "pg", schema, usePlural: true }),
    secret: deps.secret,
    baseURL: deps.baseURL,
    advanced: {
      // "uuid" leaves ids to gen_random_uuid() and keeps Better Auth's own derived ids valid uuids
      database: { generateId: "uuid" },
      useSecureCookies: deps.baseURL.startsWith("https://"),
      // Better Auth skips origin and callback checks when NODE_ENV is test; keep them on everywhere
      disableOriginCheck: false,
    },
    session: { expiresIn: SESSION_DAYS * SECONDS_PER_DAY, updateAge: SECONDS_PER_DAY },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: { "/magic-link/verify": LINK_OPEN_RATE_RULE },
    },
    account: { encryptOAuthTokens: true },
    socialProviders: deps.google ? { google: { ...deps.google, prompt: "select_account" } } : {},
    user: { deleteUser: { enabled: true } },
    plugins: [
      magicLink({
        expiresIn: LINK_LIFETIME_SECONDS,
        storeToken: "hashed",
        sendMagicLink: ({ email, url, token }) => deps.sendSignInLink(email, { url, token }),
      }),
      ...(deps.plugins ?? []),
    ],
  });
}
