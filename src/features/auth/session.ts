import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export type SessionUser = { id: string; name: string; email: string; image: string | null };

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    return null;
  }

  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (user === null) {
    redirect("/sign-in");
  }
  return user;
}
