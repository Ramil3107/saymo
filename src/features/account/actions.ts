"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, requireUser } from "@/features/auth";
import { type DeletionResult, deletionOutcome } from "./deletionOutcome";

export async function signOut(): Promise<never> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}

export async function deleteAccount(): Promise<{ outcome: DeletionResult }> {
  await requireUser();

  try {
    await auth.api.deleteUser({ body: {}, headers: await headers() });
  } catch (error) {
    return { outcome: deletionOutcome(error) };
  }

  return { outcome: "deleted" };
}
