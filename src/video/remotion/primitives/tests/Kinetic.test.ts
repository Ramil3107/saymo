import { expect, test } from "vitest";
import { parseNumber } from "../Kinetic";

test("parseNumber splits a value into a prefix, a number and a suffix", () => {
  expect(parseNumber("-40%")).toEqual({ value: -40, prefix: undefined, suffix: "%" });
  expect(parseNumber("£425")).toEqual({ value: 425, prefix: "£", suffix: undefined });
  expect(parseNumber("180°")).toEqual({ value: 180, prefix: undefined, suffix: "°" });
  expect(parseNumber("2,5 млн")).toEqual({ value: 2.5, prefix: undefined, suffix: "млн" });
});

test("parseNumber leaves words alone", () => {
  expect(parseNumber("Завжди")).toBeNull();
});
