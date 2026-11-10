import { z } from "zod";

const LINK_PATH = "/sign-in/link";
const MAX_TOKEN_LENGTH = 512;

export const INVALID_LINK_PATH = "/sign-in?error=INVALID_TOKEN";

export const SignInTokenSchema = z.string().min(1).max(MAX_TOKEN_LENGTH);

export function signInLinkUrl(baseURL: string, token: string): string {
  const url = new URL(LINK_PATH, baseURL);
  url.searchParams.set("token", token);
  return url.toString();
}
