import { describe, expect, it } from "vitest";
import type { Transition } from "../../schema/video";
import { tempos } from "../tempo";
import { transitionHalfMs, transitionLook, transitionPhase } from "../transitions";

const { snap, glide } = tempos;
const kinds: Transition[] = ["flash", "wipe", "whip", "zoom", "pixelate", "dip"];

describe("transitionHalfMs", () => {
  it("makes a cut instant", () => {
    expect(transitionHalfMs("cut", snap)).toBe(0);
  });

  it("flashes for two frames in snap and dips quickly in glide", () => {
    expect(transitionHalfMs("flash", snap)).toBe(snap.flashMs);
    expect(transitionHalfMs("flash", glide)).toBe(glide.quickMs);
  });

  it.each(kinds.filter((kind) => kind !== "flash"))("%s is longer in glide than in snap", (kind) => {
    expect(transitionHalfMs(kind, glide)).toBeGreaterThan(transitionHalfMs(kind, snap));
  });
});

describe("transitionPhase", () => {
  const edges: { into: Transition; outof: Transition } = { into: "whip", outof: "zoom" };

  it("runs the entrance at the start and the exit at the end of a scene", () => {
    expect(transitionPhase(0, 3000, edges, snap)).toEqual({ kind: "whip", side: "in", p: 0 });
    expect(transitionPhase(1500, 3000, edges, snap)).toBeNull();
    expect(transitionPhase(2999, 3000, edges, snap)?.side).toBe("out");
  });

  it("leaves a scene between two cuts untouched", () => {
    expect(transitionPhase(0, 3000, { into: "cut", outof: "cut" }, snap)).toBeNull();
  });
});

describe("transitionLook", () => {
  it.each(kinds)("%s leaves the scene untouched once it has fully entered", (kind) => {
    const look = transitionLook({ kind, side: "in", p: 1 }, glide);
    expect(look.x).toBeCloseTo(0);
    expect(look.scale).toBeCloseTo(1);
    expect(look.blur + look.smear + look.pixel + look.cover).toBeCloseTo(0);
    expect(look.panel === null || look.panel.left >= 1).toBe(true);
  });

  it("covers the frame fully with a wipe panel at the cut", () => {
    expect(transitionLook({ kind: "wipe", side: "out", p: 1 }, snap).panel).toEqual({ left: 0, right: 1 });
    expect(transitionLook({ kind: "wipe", side: "in", p: 0 }, snap).panel).toEqual({ left: 0, right: 1 });
  });

  it("never empties the frame at the cut of a whip", () => {
    const leaving = transitionLook({ kind: "whip", side: "out", p: 1 }, snap);
    expect(Math.abs(leaving.x)).toBeLessThan(1);
    expect(leaving.smear).toBeCloseTo(1);
  });
});
