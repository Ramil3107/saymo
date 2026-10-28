import { expect, test } from "vitest";
import { frameToMs, msToFrame } from "./frames";

test("msToFrame rounds to the nearest frame at 30 fps", () => {
  expect(msToFrame(1000)).toBe(30);
  expect(msToFrame(1016)).toBe(30);
  expect(msToFrame(1017)).toBe(31);
});

test("frameToMs is the inverse on whole frames", () => {
  expect(frameToMs(45)).toBe(1500);
});
