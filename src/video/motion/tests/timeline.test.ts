import { describe, expect, it } from "vitest";
import { tempos } from "../tempo";
import { blink, chase, countAt, eased, lettersShown, staggered } from "../timeline";

const { snap, glide } = tempos;

describe("eased", () => {
  it("is 0 before the start and 1 after the end", () => {
    expect(eased(0, 100, 200, snap.enterCurve)).toBe(0);
    expect(eased(400, 100, 200, snap.enterCurve)).toBe(1);
  });

  it("jumps to the end when the duration is zero", () => {
    expect(eased(99, 100, 0, snap.enterCurve)).toBe(0);
    expect(eased(100, 100, 0, snap.enterCurve)).toBe(1);
  });

  it("covers most of an enter in its first third", () => {
    expect(eased(100, 0, 300, snap.enterCurve)).toBeGreaterThan(0.6);
  });
});

describe("staggered", () => {
  it("offsets each item by the step", () => {
    expect(staggered(250, 3, snap.staggerMs)).toBe(250 + 3 * 33);
  });
});

describe("lettersShown", () => {
  it("types one letter per step and stops at the end", () => {
    expect(lettersShown(0, 100, 5, snap.letterMs)).toBe(0);
    expect(lettersShown(100, 100, 5, snap.letterMs)).toBe(1);
    expect(lettersShown(100 + 2 * snap.letterMs, 100, 5, snap.letterMs)).toBe(3);
    expect(lettersShown(10_000, 100, 5, snap.letterMs)).toBe(5);
  });

  it("types slower in the glide tempo", () => {
    const ms = 100 + 300;
    expect(lettersShown(ms, 100, 20, glide.letterMs)).toBeLessThan(lettersShown(ms, 100, 20, snap.letterMs));
  });
});

describe("countAt", () => {
  const range = { from: 10, to: 30 };

  it("holds each value for a whole step in a stepped count", () => {
    const window = { startMs: 0, durationMs: 800, stepMs: 100 };
    expect(countAt(130, window, range, snap.enterCurve)).toBe(countAt(199, window, range, snap.enterCurve));
  });

  it("reaches the end value even when the duration is not a whole number of steps", () => {
    const window = { startMs: 0, durationMs: 790, stepMs: 100 };
    expect(countAt(790, window, range, snap.enterCurve)).toBe(30);
  });

  it("starts at the first value", () => {
    expect(countAt(0, { startMs: 0, durationMs: 800, stepMs: 0 }, range, glide.enterCurve)).toBe(10);
  });
});

describe("blink and chase", () => {
  it("blinks on for the first half of the period", () => {
    expect(blink(0, 1000)).toBe(true);
    expect(blink(600, 1000)).toBe(false);
  });

  it("lights one item of the chase at a time", () => {
    const lit = [0, 1, 2].filter((index) => chase(250, 900, 3, index));
    expect(lit).toEqual([0]);
    expect(chase(400, 900, 3, 1)).toBe(true);
  });
});
