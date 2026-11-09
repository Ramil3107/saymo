import { expect, it } from "vitest";
import { halftoneDots } from "../halftoneDots";

const frames = [
  { width: 1080, height: 1920 },
  { width: 1080, height: 1080 },
  { width: 1920, height: 1080 },
];
const times = [0, 2500];

it("keeps the middle of the frame, where the text sits, clear in every format", () => {
  for (const frame of frames) {
    for (const ms of times) {
      const inMiddle = halftoneDots(frame, ms).filter(
        (dot) =>
          dot.x > frame.width * 0.3 &&
          dot.x < frame.width * 0.7 &&
          dot.y > frame.height * 0.38 &&
          dot.y < frame.height * 0.62,
      );

      expect(inMiddle).toEqual([]);
    }
  }
});

it("grows the dots toward the corners", () => {
  for (const frame of frames) {
    const dots = halftoneDots(frame, 0);
    const largest = dots.reduce((big, dot) => (dot.r > big.r ? dot : big));
    const nearCorner =
      Math.hypot(largest.x - frame.width, largest.y) < frame.width * 0.15 ||
      Math.hypot(largest.x, largest.y - frame.height) < frame.width * 0.15;

    expect(dots.length).toBeGreaterThan(0);
    expect(nearCorner).toBe(true);
  }
});
