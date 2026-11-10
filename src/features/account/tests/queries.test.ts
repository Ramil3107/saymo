import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { setUpAuth, signInByEmail } from "@/features/auth/testing";
import type { Database } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { signInMethod } from "../queries";

test("a person who only used email links signed in with email", async () => {
  const { auth, links, db } = await setUpAuth();
  await signInByEmail(auth, "ana@company.com", links);
  const person = await findUser(db, "ana@company.com");
  expect(await signInMethod(db, person.id)).toBe("email");
});

test("a person with a Google account signed in with Google", async () => {
  const { db } = await setUpAuth();
  const person = await insertUser(db, "bo@company.com");
  await db.insert(accounts).values({ userId: person.id, providerId: "google", accountId: "g-1" });
  expect(await signInMethod(db, person.id)).toBe("google");
});

async function findUser(db: Database, email: string) {
  const [person] = await db.select().from(users).where(eq(users.email, email));
  if (person === undefined) {
    throw new Error(`No user ${email}`);
  }
  return person;
}

async function insertUser(db: Database, email: string) {
  const [person] = await db.insert(users).values({ name: "Bo", email, emailVerified: true }).returning();
  if (person === undefined) {
    throw new Error(`Could not insert ${email}`);
  }
  return person;
}
