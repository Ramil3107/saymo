import { expect, test } from "vitest";
import { SignInTokenSchema, signInLinkUrl } from "../signInLink";

const REAL_LOOKING_TOKEN = "kQzTbWnhRfLcXyPvAmDsJeGuHoNiBtKl";

test("the link opens the sign-in link page with the token encoded", () => {
  expect(signInLinkUrl("http://localhost:3000", "a+b/c")).toBe(
    "http://localhost:3000/sign-in/link?token=a%2Bb%2Fc",
  );
});

test("a base URL with a trailing slash gives the same single slash", () => {
  expect(signInLinkUrl("http://localhost:3000/", "a+b/c")).toBe(
    "http://localhost:3000/sign-in/link?token=a%2Bb%2Fc",
  );
});

test("a token is a non-empty string of at most 512 characters", () => {
  expect(SignInTokenSchema.safeParse(REAL_LOOKING_TOKEN).success).toBe(true);
  expect(SignInTokenSchema.safeParse("").success).toBe(false);
  expect(SignInTokenSchema.safeParse("a".repeat(513)).success).toBe(false);
  expect(SignInTokenSchema.safeParse(["a", "b"]).success).toBe(false);
  expect(SignInTokenSchema.safeParse(undefined).success).toBe(false);
});
