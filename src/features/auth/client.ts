import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { type LinkProblem, linkProblem } from "./signInErrors";

export type LinkRequestOutcome = "sent" | LinkProblem;

const HOME_PATH = "/home";
const SIGN_IN_PATH = "/sign-in";

export const authClient = createAuthClient({ plugins: [magicLinkClient()] });

export async function requestSignInLink(email: string): Promise<LinkRequestOutcome> {
  try {
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: HOME_PATH,
      newUserCallbackURL: HOME_PATH,
      errorCallbackURL: SIGN_IN_PATH,
    });
    return error ? linkProblem(error.status) : "sent";
  } catch {
    return "sendFailed";
  }
}

export async function startGoogleSignIn(): Promise<boolean> {
  try {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: HOME_PATH,
      errorCallbackURL: SIGN_IN_PATH,
    });
    return error === null;
  } catch {
    return false;
  }
}
