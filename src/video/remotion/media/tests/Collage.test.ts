import { describe, expect, it } from "vitest";
import { type CollageLayout, tileOf } from "../Collage";

const area = { x: 0, y: 0, w: 1000, h: 1000 };
const layouts: CollageLayout[] = ["staircase", "scatter"];

describe("tileOf", () => {
  it("climbs a staircase from the bottom left to the top right", () => {
    const first = tileOf("staircase", 0, 5, area).rect;
    const last = tileOf("staircase", 4, 5, area).rect;

    expect(first.x).toBe(0);
    expect(first.y + first.h).toBeCloseTo(area.h);
    expect(last.x + last.w).toBeCloseTo(area.w);
    expect(last.y).toBe(0);
  });

  it("keeps every tile inside the area", () => {
    for (const layout of layouts) {
      for (let index = 0; index < 6; index++) {
        const { rect } = tileOf(layout, index, 6, area);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(area.w + 0.001);
        expect(rect.y + rect.h).toBeLessThanOrEqual(area.h + 0.001);
      }
    }
  });

  it("turns scattered tiles at small angles and keeps the staircase straight", () => {
    expect(tileOf("scatter", 1, 4, area).rotate).not.toBe(0);
    expect(tileOf("staircase", 1, 4, area).rotate).toBe(0);
  });
});
