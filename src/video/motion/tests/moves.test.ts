import { describe, expect, it } from "vitest";
import {
  combine,
  type Enter,
  type Exit,
  enterMs,
  enterPose,
  exitMs,
  exitPose,
  flipFace,
  type MoveSpec,
  type Pose,
  type Progress,
  poseAt,
  restPose,
} from "../moves";
import { tempos } from "../tempo";

const enters: Enter[] = ["cut", "fade", "pop", "punch", "rise", "lift", "drop", "smear", "reveal"];
const exits: Exit[] = ["cut", "fade", "collapse", "sink", "smear", "tilt"];
const { snap, glide } = tempos;
const poseKeys: (keyof Pose)[] = [
  "opacity",
  "x",
  "y",
  "scale",
  "scaleX",
  "rotateY",
  "blur",
  "smear",
  "clipRight",
  "maskY",
];

describe("enterPose", () => {
  it.each(enters)("%s ends at rest", (move) => {
    expectRest(enterPose(move, at(1)));
  });

  it("starts a pop small and a punch giant", () => {
    expect(enterPose("pop", at(0)).scale).toBeLessThan(1);
    expect(enterPose("punch", at(0)).scale).toBeGreaterThan(2);
  });

  it("starts a rise under its mask and a reveal fully clipped", () => {
    expect(enterPose("rise", at(0)).maskY).toBe(1);
    expect(enterPose("reveal", at(0)).clipRight).toBe(1);
  });

  it("starts a smear to the left, stretched and blurred", () => {
    const pose = enterPose("smear", at(0));
    expect(pose.x).toBeLessThan(0);
    expect(pose.scaleX).toBeGreaterThan(1);
    expect(pose.smear).toBeGreaterThan(0);
  });
});

describe("opacity", () => {
  it("fades in by time even when the curve is almost done", () => {
    expect(enterPose("pop", { eased: 0.9, linear: 0.1 }).opacity).toBeLessThan(0.3);
  });

  it("is gone before the exit ends, so the last frame does not jump", () => {
    expect(exitPose("collapse", { eased: 0.5, linear: 0.8 }).opacity).toBe(0);
  });
});

describe("exitPose", () => {
  it.each(exits)("%s starts at rest", (move) => {
    expectRest(exitPose(move, at(0)));
  });

  it.each(exits.filter((move) => move !== "sink"))("%s ends invisible", (move) => {
    expect(exitPose(move, at(1)).opacity).toBe(0);
  });

  it("ends a sink under its mask", () => {
    expect(exitPose("sink", at(1)).maskY).toBe(1);
  });
});

describe("timings", () => {
  it.each(enters.filter((move) => move !== "cut"))("%s is shorter in snap than in glide", (move) => {
    expect(enterMs(move, snap)).toBeLessThan(enterMs(move, glide));
  });

  it("makes cuts instant", () => {
    expect(enterMs("cut", snap)).toBe(0);
    expect(exitMs("cut", glide)).toBe(0);
  });
});

describe("poseAt", () => {
  const spec: MoveSpec = { enter: "pop", atMs: 100, exit: { move: "fade", atMs: 1000 } };

  it("hides the element before it enters and after it leaves", () => {
    expect(poseAt(99, spec, snap)).toBeNull();
    expect(poseAt(1001 + exitMs("fade", snap), spec, snap)).toBeNull();
  });

  it("holds at rest between the enter and the exit", () => {
    const pose = poseAt(600, spec, snap);
    expect(pose).not.toBeNull();
    if (pose) expectRest(pose);
  });

  it("draws the last frame of an exit at its end state", () => {
    const sinking: MoveSpec = { enter: "cut", atMs: 0, exit: { move: "sink", atMs: 500 } };
    const lastMs = 500 + exitMs("sink", snap);
    expect(poseAt(lastMs, sinking, snap)?.maskY).toBe(1);
    expect(poseAt(1000 + exitMs("fade", snap), spec, snap)?.opacity).toBe(0);
  });

  it("fades out during the exit", () => {
    const pose = poseAt(1000 + exitMs("fade", glide) / 2, spec, glide);
    expect(pose?.opacity).toBeGreaterThan(0);
    expect(pose?.opacity).toBeLessThan(1);
  });
});

describe("combine and flipFace", () => {
  it("multiplies opacity and scale and adds offsets", () => {
    const pose = combine(
      { ...restPose, opacity: 0.5, x: 0.1, scale: 2 },
      { ...restPose, opacity: 0.5, x: 0.2 },
    );
    expect(pose.opacity).toBe(0.25);
    expect(pose.x).toBeCloseTo(0.3);
    expect(pose.scale).toBe(2);
  });

  it("shows the front, turns edge-on, then shows the back", () => {
    expect(flipFace(0)).toEqual({ scaleX: 1, back: false });
    expect(flipFace(0.5).scaleX).toBeCloseTo(0);
    expect(flipFace(1).back).toBe(true);
  });
});

function expectRest(pose: Pose) {
  for (const key of poseKeys) {
    expect(pose[key], key).toBeCloseTo(restPose[key]);
  }
}

function at(p: number): Progress {
  return { eased: p, linear: p };
}
