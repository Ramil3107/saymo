import { APIError } from "better-auth/api";
import { z } from "zod";

export type DeletionOutcome = "sign-in-again" | "failed";
export type DeletionResult = DeletionOutcome | "deleted";

const STALE_SESSION_CODES = ["SESSION_EXPIRED", "SESSION_NOT_FRESH"];

const StaleSessionBodySchema = z.object({
  code: z.string().refine((code) => STALE_SESSION_CODES.includes(code)),
});

export function deletionOutcome(error: unknown): DeletionOutcome {
  if (!(error instanceof APIError)) {
    return "failed";
  }
  return StaleSessionBodySchema.safeParse(error.body).success ? "sign-in-again" : "failed";
}
