import { expect, test } from "vitest";
import { redirectFor } from "../routes";

test("a signed-out visit to an app page goes to sign-in", () => {
  expect(redirectFor("/home", false)).toBe("/sign-in");
  expect(redirectFor("/account", false)).toBe("/sign-in");
  expect(redirectFor("/videos/123", false)).toBe("/sign-in");
});

test("public pages stay open without a session", () => {
  for (const path of ["/", "/sign-in", "/api/auth/magic-link/verify", "/r/7Kq2xV", "/terms", "/privacy"]) {
    expect(redirectFor(path, false)).toBeNull();
  }
});

test("a prefix only matches whole segments", () => {
  expect(redirectFor("/reports", false)).toBe("/sign-in");
});

test("a cookie lets app pages through, and sign-in is never redirected by the cookie alone", () => {
  expect(redirectFor("/home", true)).toBeNull();
  expect(redirectFor("/sign-in", true)).toBeNull();
});
