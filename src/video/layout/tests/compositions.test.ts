import { describe, expect, it } from "vitest";
import { type DestinationId, destinations } from "../../destinations";
import type { Box } from "../../schema/content";
import { type ComposeContext, type Composition, compose, type Pieces } from "../compositions";
import { intersectionArea } from "../geometry";

type Family = Exclude<Composition, "center">;

const families: Family[] = ["fill", "split", "edge-number", "column", "grid"];
const formats: DestinationId[] = ["reels", "file", "youtube"];
const chip = (id: string, w = 0.3) => ({ id, size: { w, h: 0.05 }, enterMs: 300, exitMs: 2000 });
const beat: Pieces = { leadId: "title", supports: [chip("a"), chip("b")] };
const epsilon = 1e-6;

function contextFor(destination: DestinationId, variant = 0): ComposeContext {
  const { format, safeZone } = destinations[destination];
  return { format, safeZone, variant, durationMs: 2400 };
}

function insideSafeZone(box: Box, destination: DestinationId): boolean {
  const zone = destinations[destination].safeZone;
  return (
    box.x >= zone.left - epsilon &&
    box.y >= zone.top - epsilon &&
    box.x + box.w <= 1 - zone.right + epsilon &&
    box.y + box.h <= 1 - zone.bottom + epsilon
  );
}

describe.each(families)("compose %s", (family) => {
  it.each(formats)("places the title and the labels inside the %s safe zone, apart", (destination) => {
    const { placements } = compose(family, beat, contextFor(destination));
    const boxes = [...placements.values()].map((placement) => placement.box);

    expect([...placements.keys()].sort()).toEqual(["a", "b", "title"]);
    for (const box of boxes) expect(insideSafeZone(box, destination)).toBe(true);
    boxes.forEach((box, index) => {
      for (const other of boxes.slice(index + 1)) expect(intersectionArea(box, other)).toBe(0);
    });
  });

  it("keeps its fields inside the frame", () => {
    for (const variant of [0, 1]) {
      for (const field of compose(family, beat, contextFor("reels", variant)).fields) {
        expect(field.box.x).toBeGreaterThanOrEqual(0);
        expect(field.box.y).toBeGreaterThanOrEqual(0);
        expect(field.box.x + field.box.w).toBeLessThanOrEqual(1 + epsilon);
        expect(field.box.y + field.box.h).toBeLessThanOrEqual(1 + epsilon);
      }
    }
  });
});

describe("compose", () => {
  it("spreads a fill title, fits a split one and bleeds an edge number", () => {
    const fill = (family: Family) => compose(family, beat, contextFor("reels")).placements.get("title")?.fill;

    expect(fill("fill")).toBe("spread");
    expect(fill("split")).toBe("fit");
    expect(fill("edge-number")).toBe("bleed");
  });

  it("puts the split field on top first and at the bottom on a repeat, the title on the field", () => {
    const first = compose("split", beat, contextFor("reels", 0));
    const repeat = compose("split", beat, contextFor("reels", 1));
    const titleCenter = (box: Box | undefined) => (box ? box.y + box.h / 2 : Number.NaN);

    expect(first.fields[0]?.box.y).toBe(0);
    expect(titleCenter(first.placements.get("title")?.box)).toBeLessThan(0.5);
    expect(repeat.fields[0]?.box.y).toBe(0.5);
    expect(titleCenter(repeat.placements.get("title")?.box)).toBeGreaterThan(0.5);
  });

  it("turns the frame dark on a second fill", () => {
    expect(compose("fill", beat, contextFor("reels", 0)).fields).toEqual([]);
    expect(compose("fill", beat, contextFor("reels", 1)).fields[0]?.tone).toBe("ink");
  });

  it("gives each grid tile a field that comes and goes with its label", () => {
    const { placements, fields } = compose("grid", beat, contextFor("reels"));

    expect(fields.map((field) => field.box)).toEqual([placements.get("a")?.box, placements.get("b")?.box]);
    expect(fields.map((field) => [field.enterMs, field.exitMs])).toEqual([
      [300, 2000],
      [300, 2000],
    ]);
    expect(new Set(fields.map((field) => field.tone)).size).toBe(2);
  });

  it("holds at most four tiles", () => {
    const many: Pieces = { supports: ["a", "b", "c", "d", "e"].map((id) => chip(id)) };
    expect(compose("grid", many, contextFor("reels")).placements.size).toBe(4);
  });

  it("leaves out labels that do not fit under the title", () => {
    const tall = { supports: ["a", "b", "c", "d"].map((id) => ({ ...chip(id), size: { w: 0.3, h: 0.1 } })) };
    const { placements } = compose("column", { leadId: "title", ...tall }, contextFor("reels"));

    expect(placements.has("title")).toBe(true);
    expect(placements.size).toBeLessThan(5);
  });

  it("keeps the column clear of its band", () => {
    const { placements, fields } = compose("column", beat, contextFor("reels"));
    const band = fields[0]?.box;

    for (const { box } of placements.values()) expect(box.x).toBeGreaterThan((band?.x ?? 0) + (band?.w ?? 0));
  });
});

describe("compose with a corner label", () => {
  it.each(families)("gives the %s corner label the top line and keeps the rest below it", (family) => {
    const { placements } = compose(family, { ...beat, cornerId: "corner" }, contextFor("reels"));
    const corner = placements.get("corner")?.box;
    const others = [...placements.entries()].filter(([id]) => id !== "corner").map(([, { box }]) => box);

    expect(corner?.y).toBeCloseTo(destinations.reels.safeZone.top + 0.04, 6);
    for (const box of others) expect(box.y).toBeGreaterThan((corner?.y ?? 0) + (corner?.h ?? 0));
  });
});

it("stacks a label that exactly fills the room left for it", () => {
  const sticker = { id: "s", size: { w: 0.3, h: 0.1 }, enterMs: 0, exitMs: 2000 };
  const { placements } = compose("edge-number", { leadId: "n", supports: [sticker] }, contextFor("reels"));
  expect(placements.has("s")).toBe(true);
});
