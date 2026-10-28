import { expect, test } from "vitest";
import { formatSize } from "../destinations";
import { ElementSchema, VideoDocSchema } from "./video";

const scene = (id: string, startMs: number, durationMs: number) => ({
  id,
  startMs,
  durationMs,
  background: { kind: "brand" },
  elements: [],
  transition: "cut",
});

const doc = {
  id: "video-1",
  format: "9:16",
  fps: 30,
  durationMs: 6000,
  destination: "reels",
  register: "driving-launch",
  brand: { colors: ["#2D4BFF"], font: "Onest" },
  assets: [],
  scenes: [scene("s1", 0, 3000), scene("s2", 3000, 3000)],
  voice: [],
};

test("a document with contiguous scenes is valid", () => {
  expect(VideoDocSchema.safeParse(doc).success).toBe(true);
});

test.each([
  { name: "a gap", scenes: [scene("s1", 0, 3000), scene("s2", 3500, 2500)] },
  {
    name: "an overlap",
    scenes: [scene("s1", 0, 3000), scene("s2", 2500, 3500)],
  },
  {
    name: "a late first scene",
    scenes: [scene("s1", 500, 2500), scene("s2", 3000, 3000)],
  },
])("scenes must be contiguous: $name does not pass", ({ scenes }) => {
  expect(VideoDocSchema.safeParse({ ...doc, scenes }).success).toBe(false);
});

test("the last scene must end at durationMs", () => {
  const broken = { ...doc, durationMs: 7000 };
  expect(VideoDocSchema.safeParse(broken).success).toBe(false);
});

test("fps is fixed at 30", () => {
  const broken = { ...doc, fps: 24 };
  expect(VideoDocSchema.safeParse(broken).success).toBe(false);
});

test.each([
  { count: 0, valid: false },
  { count: 1, valid: true },
  { count: 3, valid: true },
  { count: 4, valid: false },
])("a brand with $count colors is valid: $valid", ({ count, valid }) => {
  const colors = Array.from({ length: count }, () => "#FFFFFF");
  const brand = { ...doc.brand, colors };
  expect(VideoDocSchema.safeParse({ ...doc, brand }).success).toBe(valid);
});

test("an element carries the fields of its kind", () => {
  const bigNumber = {
    id: "e1",
    kind: "big-number",
    enterMs: 0,
    exitMs: 1000,
    box: { x: 0.1, y: 0.4, w: 0.8, h: 0.12 },
    value: "3×",
  };
  const withoutValue = { ...bigNumber, value: undefined };
  const unknownKind = { ...bigNumber, kind: "ring" };
  expect(ElementSchema.safeParse(bigNumber).success).toBe(true);
  expect(ElementSchema.safeParse(withoutValue).success).toBe(false);
  expect(ElementSchema.safeParse(unknownKind).success).toBe(false);
});

test("an element box is a fraction of the frame", () => {
  const chip = {
    id: "e1",
    kind: "chip",
    enterMs: 0,
    exitMs: 1000,
    box: { x: 0, y: 0, w: 1, h: 1 },
    text: "New",
  };
  const pastTheEdge = { ...chip, box: { ...chip.box, w: 1.2 } };
  const beforeTheEdge = { ...chip, box: { ...chip.box, x: -0.01 } };
  expect(ElementSchema.safeParse(chip).success).toBe(true);
  expect(ElementSchema.safeParse(pastTheEdge).success).toBe(false);
  expect(ElementSchema.safeParse(beforeTheEdge).success).toBe(false);
});

test("formatSize", () => {
  expect(formatSize("9:16")).toEqual({ width: 1080, height: 1920 });
  expect(formatSize("1:1")).toEqual({ width: 1080, height: 1080 });
  expect(formatSize("16:9")).toEqual({ width: 1920, height: 1080 });
});
