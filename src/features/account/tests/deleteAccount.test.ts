import { expect, onTestFinished, test, vi } from "vitest";
import { setUpAuth, signInByEmail } from "@/features/auth/testing";
import { accounts, sessions, users } from "@/lib/db/schema";
import { deletionOutcome } from "../deletionOutcome";

const TWO_DAYS_MS = 2 * 24 * 60 * 60_000;

test("deleting the account removes the person, their sessions and accounts", async () => {
  const { auth, links, db } = await setUpAuth();
  const { cookie } = await signInByEmail(auth, "ana@company.com", links);
  const [person] = await db.select().from(users);
  if (person === undefined) {
    throw new Error("Sign-in created no user");
  }
  await db.insert(accounts).values({ userId: person.id, providerId: "google", accountId: "g-1" });
  expect(await db.select().from(accounts)).toHaveLength(1);
  await auth.api.deleteUser({ body: {}, headers: new Headers({ cookie }) });
  expect(await db.select().from(users)).toHaveLength(0);
  expect(await db.select().from(sessions)).toHaveLength(0);
  expect(await db.select().from(accounts)).toHaveLength(0);
  expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
});

test("an old session has to sign in again before deleting", async () => {
  const { auth, links } = await setUpAuth();
  const { cookie } = await signInByEmail(auth, "ana@company.com", links);
  onTestFinished(() => {
    vi.useRealTimers();
  });
  vi.setSystemTime(Date.now() + TWO_DAYS_MS);
  const attempt = auth.api.deleteUser({ body: {}, headers: new Headers({ cookie }) });
  await expect(attempt).rejects.toThrow();
  expect(deletionOutcome(await attempt.catch((error: unknown) => error))).toBe("sign-in-again");
});

test("any other failure while deleting is just a failure", () => {
  expect(deletionOutcome(new Error("boom"))).toBe("failed");
});
