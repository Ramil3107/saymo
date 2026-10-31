import { expect, test } from "vitest";
import { parseNumber } from "../Kinetic";

test("parseNumber splits a value into a prefix, a number and a suffix", () => {
  expect(parseNumber("-40%")).toEqual({ value: -40, decimals: 0, prefix: undefined, suffix: "%" });
  expect(parseNumber("£425")).toEqual({ value: 425, decimals: 0, prefix: "£", suffix: undefined });
  expect(parseNumber("180°")).toEqual({ value: 180, decimals: 0, prefix: undefined, suffix: "°" });
  expect(parseNumber("2,5 млн")).toEqual({ value: 2.5, decimals: 1, prefix: undefined, suffix: "млн" });
  expect(parseNumber("$2.50")).toEqual({ value: 2.5, decimals: 2, prefix: "$", suffix: undefined });
});

test("parseNumber leaves words alone", () => {
  expect(parseNumber("Завжди")).toBeNull();
});
