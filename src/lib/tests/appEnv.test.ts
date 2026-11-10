import { expect, test } from "vitest";
import { databaseUrl, googleSignIn, loadAppEnv } from "../appEnv";

const complete = {
  DATABASE_URL: "postgresql://saymo:secret@localhost:5432/saymo",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

test("a complete environment parses", () => {
  expect(loadAppEnv(complete).BETTER_AUTH_URL).toBe("http://localhost:3000");
});

test("a short auth secret is rejected", () => {
  expect(() => loadAppEnv({ ...complete, BETTER_AUTH_SECRET: "short" })).toThrow("BETTER_AUTH_SECRET");
});

test("email goes to the local Mailpit by default", () => {
  const env = loadAppEnv(complete);
  expect(env.SMTP_URL).toBe("smtp://127.0.0.1:1025");
  expect(env.EMAIL_FROM).toBe("Saymo <hello@saymo.local>");
});

test("Google sign-in is off when its keys are empty", () => {
  const env = loadAppEnv({ ...complete, GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "" });
  expect(googleSignIn(env)).toBeUndefined();
});

test("Google sign-in needs both the id and the secret", () => {
  expect(() => loadAppEnv({ ...complete, GOOGLE_CLIENT_ID: "id" })).toThrow("GOOGLE_CLIENT_SECRET");
});

test("Google sign-in is on when both keys are set", () => {
  const env = loadAppEnv({ ...complete, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });
  expect(googleSignIn(env)).toEqual({ clientId: "id", clientSecret: "secret" });
});

test("the database url alone is enough for the database", () => {
  expect(databaseUrl({ DATABASE_URL: complete.DATABASE_URL })).toBe(complete.DATABASE_URL);
});

test("a missing database url names the variable", () => {
  expect(() => databaseUrl({})).toThrow("DATABASE_URL");
});
