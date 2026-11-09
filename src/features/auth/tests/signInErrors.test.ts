import { expect, test } from "vitest";
import { linkProblem, signInMessage } from "../signInErrors";

test("a bad or used link reads as expired", () => {
  expect(signInMessage({ error: "INVALID_TOKEN" })).toBe("linkExpired");
  expect(signInMessage({ error: "EXPIRED_TOKEN" })).toBe("linkExpired");
});

test("any other error from the sign-in round trip reads as a Google problem", () => {
  expect(signInMessage({ error: "access_denied" })).toBe("googleFailed");
});

test("a deleted account gets a goodbye", () => {
  expect(signInMessage({ deleted: "1" })).toBe("accountDeleted");
});

test("a plain visit shows no message", () => {
  expect(signInMessage({})).toBeNull();
});

test("a refused link request reads as too many tries, any other failure as a failed send", () => {
  expect(linkProblem(429)).toBe("tooManyTries");
  expect(linkProblem(500)).toBe("sendFailed");
  expect(linkProblem(403)).toBe("sendFailed");
});
