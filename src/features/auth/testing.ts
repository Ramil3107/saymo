import type { PgliteDatabase } from "drizzle-orm/pglite";
import { onTestFinished } from "vitest";
import type { Schema } from "@/lib/db/client";
import { createTestDb } from "@/lib/db/testDb";
import { type Auth, createAuth } from "./createAuth";

export const TEST_BASE_URL = "http://localhost:3000";

const SECRET = "a".repeat(32);
const CLIENT_IP = "203.0.113.7";
const LINK_REQUEST_URL = `${TEST_BASE_URL}/api/auth/sign-in/magic-link`;
const SESSION_COOKIE = "better-auth.session_token";

type LinkRequest = { callbackURL?: string; newUserCallbackURL?: string; errorCallbackURL?: string };

export async function setUpAuth(): Promise<{ auth: Auth; links: string[]; db: PgliteDatabase<Schema> }> {
  const { db, close } = await createTestDb();
  onTestFinished(close);

  const links: string[] = [];
  const auth = createAuth({
    db,
    secret: SECRET,
    baseURL: TEST_BASE_URL,
    async sendSignInLink(_to, url) {
      links.push(url);
    },
  });

  return { auth, links, db };
}

export function requestLink(auth: Auth, email: string, overrides: LinkRequest = {}): Promise<Response> {
  const body = { email, callbackURL: "/home", newUserCallbackURL: "/home", errorCallbackURL: "/sign-in" };

  return auth.handler(
    new Request(LINK_REQUEST_URL, {
      method: "POST",
      headers: { origin: TEST_BASE_URL, "content-type": "application/json", "x-forwarded-for": CLIENT_IP },
      body: JSON.stringify({ ...body, ...overrides }),
    }),
  );
}

export function openLink(auth: Auth, url: string | undefined): Promise<Response> {
  if (url === undefined) {
    throw new Error("No sign-in link was sent");
  }
  return auth.handler(new Request(url, { headers: { "x-forwarded-for": CLIENT_IP } }));
}

export async function signInByEmail(auth: Auth, email: string, links: string[]): Promise<{ cookie: string }> {
  const requested = await requestLink(auth, email);
  if (!requested.ok) {
    throw new Error(`Requesting a sign-in link for ${email} failed with ${requested.status}`);
  }

  const opened = await openLink(auth, links.at(-1));

  return { cookie: sessionCookieFrom(opened) };
}

function sessionCookieFrom(response: Response): string {
  const header = response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  if (header === undefined) {
    throw new Error(`Opening the link set no session cookie (status ${response.status})`);
  }

  const [nameAndValue = ""] = header.split(";");
  return nameAndValue;
}
