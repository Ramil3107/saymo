import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";

export async function signInMethod(db: Database, userId: string): Promise<"google" | "email"> {
  const [google] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .limit(1);

  return google === undefined ? "email" : "google";
}
