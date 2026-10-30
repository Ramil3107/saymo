import { expect, test } from "vitest";
import { mixRect } from "../geometry";

test("mixRect moves every edge of a rect toward the target", () => {
  const from = { x: 0, y: 0, w: 10, h: 10 };
  const to = { x: 100, y: 50, w: 210, h: 110 };

  expect(mixRect(from, to, 0)).toEqual(from);
  expect(mixRect(from, to, 1)).toEqual(to);
  expect(mixRect(from, to, 0.5)).toEqual({ x: 50, y: 25, w: 110, h: 60 });
});
