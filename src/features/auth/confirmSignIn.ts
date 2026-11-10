"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { INVALID_LINK_PATH, SignInTokenSchema } from "./signInLink";

const HOME_PATH = "/home";

export async function confirmSignIn(formData: FormData): Promise<never> {
  const token = SignInTokenSchema.safeParse(formData.get("token"));
  const signedIn = token.success && (await signInWithToken(token.data));

  redirect(signedIn ? HOME_PATH : INVALID_LINK_PATH);
}

// Skips the rate limiter and origin check: no callbackURL, long single-use hashed tokens, Next checks Origin
async function signInWithToken(token: string): Promise<boolean> {
  try {
    await auth.api.magicLinkVerify({ query: { token }, headers: await headers() });
    return true;
  } catch (error) {
    if (isAPIError(error)) return false;
    throw error;
  }
}
