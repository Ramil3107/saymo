export type SignInMessage = "linkExpired" | "googleFailed" | "accountDeleted";
export type LinkProblem = "tooManyTries" | "sendFailed";

type SignInParams = { error?: string; deleted?: string };

const LINK_ERRORS = ["INVALID_TOKEN", "EXPIRED_TOKEN"];
const TOO_MANY_REQUESTS = 429;

export function signInMessage(params: SignInParams): SignInMessage | null {
  if (params.error) {
    return LINK_ERRORS.includes(params.error) ? "linkExpired" : "googleFailed";
  }
  if (params.deleted === "1") {
    return "accountDeleted";
  }
  return null;
}

export function linkProblem(status: number): LinkProblem {
  return status === TOO_MANY_REQUESTS ? "tooManyTries" : "sendFailed";
}
