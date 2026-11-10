import { nextCookies } from "better-auth/next-js";
import { sendSignInLinkEmail } from "@/features/emails";
import { appEnv, googleSignIn } from "@/lib/appEnv";
import { db } from "@/lib/db/client";
import { mailer } from "@/lib/email/mailer";
import { createAuth } from "./createAuth";
import { signInLinkUrl } from "./signInLink";

const env = appEnv();

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  google: googleSignIn(env),
  sendSignInLink: (to, { token }) =>
    sendSignInLinkEmail(mailer(), { to, url: signInLinkUrl(env.BETTER_AUTH_URL, token) }),
  plugins: [nextCookies()],
});
