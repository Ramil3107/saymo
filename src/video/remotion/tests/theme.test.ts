import { expect, test } from "vitest";
import { ink, textOn, white } from "../theme";

test("dark text sits on a light accent and white text on a dark one", () => {
  expect(textOn("#FFD23F")).toBe(ink);
  expect(textOn("#FFFFFF")).toBe(ink);
  expect(textOn("#2D4BFF")).toBe(white);
  expect(textOn("#0F7A6B")).toBe(white);
});

test("an unreadable color falls back to white text", () => {
  expect(textOn("red")).toBe(white);
});
