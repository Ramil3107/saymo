import { eq } from "drizzle-orm";
import { expect, onTestFinished, test, vi } from "vitest";
import { users, verifications } from "@/lib/db/schema";
import { openLink, requestLink, setUpAuth, signInByEmail, TEST_BASE_URL } from "../testing";

const HOME_LANDING = `${TEST_BASE_URL}/home`;
const INVALID_LINK_LANDING = `${TEST_BASE_URL}/sign-in?error=INVALID_TOKEN`;
const NINE_MINUTES_MS = 9 * 60_000;
const ELEVEN_MINUTES_MS = 11 * 60_000;

test("an email link signs a new person in with a working session and verifies the email", async () => {
  const { auth, links, db } = await setUpAuth();
  const { cookie } = await signInByEmail(auth, "ana@company.com", links);
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  expect(session?.user.email).toBe("ana@company.com");
  const [person] = await db.select().from(users).where(eq(users.email, "ana@company.com"));
  expect(person?.emailVerified).toBe(true);
});

test("a person whose email is not verified yet signs in with a link and gets it verified", async () => {
  const { auth, links, db } = await setUpAuth();
  await db.insert(users).values({ name: "Bo", email: "bo@company.com", emailVerified: false });
  const { cookie } = await signInByEmail(auth, "bo@company.com", links);
  expect(cookie).toContain("better-auth.session_token=");
  const [person] = await db.select().from(users).where(eq(users.email, "bo@company.com"));
  expect(person?.emailVerified).toBe(true);
});

test("a link works once", async () => {
  const { auth, links } = await setUpAuth();
  await requestLink(auth, "ana@company.com");
  const first = await openLink(auth, links[0]);
  const second = await openLink(auth, links[0]);
  expect(first.headers.get("location")).toBe(HOME_LANDING);
  expect(second.status).toBe(302);
  expect(second.headers.get("location")).toBe(INVALID_LINK_LANDING);
});

test("a link expires after ten minutes", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { auth, links } = await setUpAuth();
  await requestLink(auth, "ana@company.com");
  vi.setSystemTime(Date.now() + ELEVEN_MINUTES_MS);
  const opened = await openLink(auth, links[0]);
  expect(opened.headers.get("location")).toBe(INVALID_LINK_LANDING);
});

test("a link still works at nine minutes", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { auth, links } = await setUpAuth();
  await requestLink(auth, "ana@company.com");
  vi.setSystemTime(Date.now() + NINE_MINUTES_MS);
  const opened = await openLink(auth, links[0]);
  expect(opened.headers.get("location")).toBe(HOME_LANDING);
});

test("the link's token is not stored as sent", async () => {
  const { auth, links, db } = await setUpAuth();
  await requestLink(auth, "ana@company.com");
  const token = new URL(links[0] ?? "").searchParams.get("token") ?? "";
  const rows = await db.select().from(verifications);
  expect(token).not.toBe("");
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(JSON.stringify(row)).not.toContain(token);
  }
});

test("many opens of a used link from one office address are not rate limited", async () => {
  const { auth, links } = await setUpAuth();
  await requestLink(auth, "ana@company.com");
  await openLink(auth, links[0]);
  const landings: (string | null)[] = [];
  for (let i = 0; i < 6; i++) {
    landings.push((await openLink(auth, links[0])).headers.get("location"));
  }
  expect(landings).toEqual(Array(6).fill(INVALID_LINK_LANDING));
});

test("a callback to another site is refused and no email goes out", async () => {
  const { auth, links } = await setUpAuth();
  const response = await requestLink(auth, "ana@company.com", { callbackURL: "https://evil.example/steal" });
  expect(response.status).toBe(403);
  expect(links).toHaveLength(0);
});

test("a sixth link request within a minute is refused", async () => {
  const { auth, links } = await setUpAuth();
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    statuses.push((await requestLink(auth, "ana@company.com")).status);
  }
  expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
  expect(statuses[5]).toBe(429);
  expect(links).toHaveLength(5);
});
