import { expect, it } from "vitest";
import { pillRows, pillSquare } from "../pillRows";

const frames = [
  { width: 1080, height: 1920 },
  { width: 1080, height: 1080 },
  { width: 1920, height: 1080 },
];
const times = [0, 4000, 9000];

it("lays rows over a square wide enough to cover the frame turned at any angle", () => {
  for (const frame of frames) {
    expect(pillSquare(frame)).toBeGreaterThanOrEqual(Math.hypot(frame.width, frame.height));
  }
});

it("covers the square with pills in every format at any time", () => {
  for (const frame of frames) {
    for (const ms of times) {
      const side = pillSquare(frame);
      const rows = pillRows(frame, ms);
      const last = rows.at(-1);

      expect(rows[0]?.y).toBeLessThanOrEqual(0);
      expect((last?.y ?? 0) + (last?.h ?? 0)).toBeGreaterThanOrEqual(side);
      for (const row of rows) {
        expect(row.pills.length).toBeGreaterThan(0);
        expect(Math.min(...row.pills.map((pill) => pill.x))).toBeLessThanOrEqual(0);
        expect(Math.max(...row.pills.map((pill) => pill.x + pill.w))).toBeGreaterThanOrEqual(side);
      }
    }
  }
});
