import { expect, test } from "vitest";
import { fractionDigits } from "../numbers";

test("fractionDigits counts the digits after the separator of the first number", () => {
  expect(fractionDigits("$2.50")).toBe(2);
  expect(fractionDigits("2,5 млн")).toBe(1);
  expect(fractionDigits("-40%")).toBe(0);
  expect(fractionDigits("Always")).toBe(0);
});
