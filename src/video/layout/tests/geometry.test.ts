import { expect, it } from "vitest";
import { insidePolygon } from "../geometry";

const slanted = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 0.5 },
  { x: 0, y: 1 },
];

it("finds a point inside a polygon on either side of its slanted edge", () => {
  expect(insidePolygon(slanted, { x: 0.2, y: 0.8 })).toBe(true);
  expect(insidePolygon(slanted, { x: 0.9, y: 0.8 })).toBe(false);
  expect(insidePolygon(slanted, { x: 0.9, y: 0.3 })).toBe(true);
  expect(insidePolygon(slanted, { x: 1.2, y: 0.3 })).toBe(false);
});
