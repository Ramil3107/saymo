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
  poseAt,
  restPose,
} from "../moves";
import { tempos } from "../tempo";

const enters: Enter[] = ["cut", "fade", "pop", "punch", "rise", "drop", "smear", "reveal"];
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
    expectRest(enterPose(move, 1));
  });

  it("starts a pop small and a punch giant", () => {
    expect(enterPose("pop", 0).scale).toBeLessThan(1);
    expect(enterPose("punch", 0).scale).toBeGreaterThan(2);
  });

  it("starts a rise under its mask and a reveal fully clipped", () => {
    expect(enterPose("rise", 0).maskY).toBe(1);
    expect(enterPose("reveal", 0).clipRight).toBe(1);
  });

  it("starts a smear to the left, stretched and blurred", () => {
    const pose = enterPose("smear", 0);
    expect(pose.x).toBeLessThan(0);
    expect(pose.scaleX).toBeGreaterThan(1);
    expect(pose.smear).toBeGreaterThan(0);
  });
});

describe("exitPose", () => {
  it.each(exits)("%s starts at rest", (move) => {
    expectRest(exitPose(move, 0));
  });

  it.each(exits.filter((move) => move !== "sink"))("%s ends invisible", (move) => {
    expect(exitPose(move, 1).opacity).toBe(0);
  });

  it("ends a sink under its mask", () => {
    expect(exitPose("sink", 1).maskY).toBe(1);
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
    expect(poseAt(1000 + exitMs("fade", snap), spec, snap)).toBeNull();
  });

  it("holds at rest between the enter and the exit", () => {
    const pose = poseAt(600, spec, snap);
    expect(pose).not.toBeNull();
    if (pose) expectRest(pose);
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
