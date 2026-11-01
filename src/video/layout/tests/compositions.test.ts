import { describe, expect, it } from "vitest";
import { type DestinationId, destinations } from "../../destinations";
import type { Box } from "../../schema/content";
import {
  type ComposeContext,
  type Composition,
  compose,
  type Field,
  fieldCovers,
  type Pieces,
} from "../compositions";
import { intersectionArea } from "../geometry";

type Family = Exclude<Composition, "center">;

const families: Family[] = [
  "fill",
  "split",
  "giant-number",
  "column",
  "grid",
  "bands",
  "diagonal",
  "inset",
  "corner-stack",
  "echo",
];
const fromTheTop: Family[] = [
  "fill",
  "split",
  "giant-number",
  "column",
  "grid",
  "diagonal",
  "corner-stack",
  "echo",
];
const formats: DestinationId[] = ["reels", "file", "youtube"];
const chip = (id: string, w = 0.3) => ({ id, size: { w, h: 0.05 }, enterMs: 300, exitMs: 2000 });
const beat: Pieces = { leadId: "title", leadLines: 2, keyword: "Friday", supports: [chip("a"), chip("b")] };
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
  it.each(formats)(
    "places the title and the labels inside the %s safe zone, apart, in both forms",
    (destination) => {
      for (const variant of [0, 1]) {
        const { placements } = compose(family, beat, contextFor(destination, variant));
        const boxes = [...placements.values()].map((placement) => placement.box);

        expect([...placements.keys()].sort()).toEqual(["a", "b", "title"]);
        for (const box of boxes) expect(insideSafeZone(box, destination)).toBe(true);
        boxes.forEach((box, index) => {
          for (const other of boxes.slice(index + 1)) expect(intersectionArea(box, other)).toBe(0);
        });
      }
    },
  );

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
  it("spreads a fill title and fits a split title and a giant number", () => {
    const fill = (family: Family) => compose(family, beat, contextFor("reels")).placements.get("title")?.fill;

    expect(fill("fill")).toBe("spread");
    expect(fill("split")).toBe("fit");
    expect(fill("giant-number")).toBe("fit");
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
  it.each(fromTheTop)(
    "starts the %s lead at the top of the text area when there is no corner label",
    (family) => {
      const lead = compose(family, beat, contextFor("reels")).placements.get("title")?.box;
      expect(lead?.y).toBeCloseTo(destinations.reels.safeZone.top + 0.04, 6);
    },
  );

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
  const { placements } = compose("giant-number", { leadId: "n", supports: [sticker] }, contextFor("reels"));
  expect(placements.has("s")).toBe(true);
});

describe("compose bands", () => {
  it("gives every title line a full-width band of its own and the lead the tone of each", () => {
    const { placements, fields } = compose("bands", beat, contextFor("reels"));
    const lead = placements.get("title");

    expect(lead).toMatchObject({ fill: "rows", align: "left" });
    expect(fields.map((field) => [field.box.x, field.box.w])).toEqual([
      [0, 1],
      [0, 1],
    ]);
    expect(lead?.lineOn).toEqual(fields.map((field) => field.tone));
    expect(fields.map((field) => field.from)).toEqual(["left", "right"]);
    for (const field of fields)
      expect(intersectionArea(field.box, lead?.box ?? field.box)).toBeGreaterThan(0);
  });

  it("turns the frame dark under the bands and sets the lines right on a repeat", () => {
    const { placements, fields } = compose("bands", beat, contextFor("reels", 1));

    expect(fields[0]).toMatchObject({ tone: "ink", box: { x: 0, y: 0, w: 1, h: 1 } });
    expect(fields).toHaveLength(3);
    expect(placements.get("title")?.align).toBe("right");
  });
});

describe("compose diagonal", () => {
  it("puts the title above the slanted cut and the labels under its high end, flush right", () => {
    const { placements, fields } = compose("diagonal", beat, contextFor("reels"));
    const [field] = fields;
    const title = placements.get("title")?.box;
    const label = placements.get("a")?.box;

    expect(field?.outline).toHaveLength(4);
    expect(corners(title).every((point) => covered(field, point))).toBe(true);
    expect(corners(label).some((point) => covered(field, point))).toBe(false);
    expect((label?.x ?? 0) + (label?.w ?? 0)).toBeCloseTo(1 - destinations.reels.safeZone.right - 0.04, 6);
  });

  it("lets the cut fall the other way on a repeat, the labels flush left", () => {
    const first = compose("diagonal", beat, contextFor("reels", 0)).fields[0]?.outline;
    const repeat = compose("diagonal", beat, contextFor("reels", 1));

    expect(repeat.fields[0]?.outline).not.toEqual(first);
    expect(repeat.placements.get("a")?.box.x).toBeCloseTo(destinations.reels.safeZone.left + 0.04, 6);
  });
});

describe("compose inset", () => {
  it("raises a card inside a frame of color and sets the title within it", () => {
    const { placements, fields } = compose("inset", beat, contextFor("reels"));
    const [frame, card] = fields;
    const title = placements.get("title")?.box;

    expect(frame).toMatchObject({ tone: "accent", box: { x: 0, y: 0, w: 1, h: 1 } });
    expect(card).toMatchObject({ tone: "surface", raised: true });
    expect(corners(title).every((point) => covered(card, point))).toBe(true);
    expect(title?.x).toBeGreaterThan(card?.box.x ?? 1);
  });

  it("lands a dark card on the backdrop on a repeat", () => {
    const { fields } = compose("inset", beat, contextFor("reels", 1));
    expect(fields).toEqual([expect.objectContaining({ tone: "ink", raised: true })]);
  });
});

describe("compose corner-stack", () => {
  it("sets the title on a block that runs off the top-left of the frame, the labels off it", () => {
    const { placements, fields } = compose("corner-stack", beat, contextFor("reels"));
    const [block] = fields;

    expect(block?.box).toMatchObject({ x: 0, y: 0 });
    expect(corners(placements.get("title")?.box).every((point) => covered(block, point))).toBe(true);
    expect(corners(placements.get("a")?.box).some((point) => covered(block, point))).toBe(false);
  });

  it("takes the bottom-right corner on a repeat, its lines flush right", () => {
    const { placements, fields } = compose("corner-stack", beat, contextFor("reels", 1));
    const block = fields[0]?.box;

    expect((block?.x ?? 0) + (block?.w ?? 0)).toBeCloseTo(1, 6);
    expect((block?.y ?? 0) + (block?.h ?? 0)).toBeCloseTo(1, 6);
    expect(placements.get("title")?.align).toBe("right");
    expect(corners(placements.get("a")?.box).some((point) => covered(fields[0], point))).toBe(false);
  });
});

describe("compose echo", () => {
  it("repeats the key word in rows over the frame, which text does not count as its field", () => {
    const { fields } = compose("echo", beat, contextFor("reels"));
    const [pattern] = fields;

    expect(pattern?.echo).toEqual({ text: "Friday", rows: 9 });
    expect(pattern && fieldCovers(pattern, { x: 0.5, y: 0.5 })).toBe(false);
    expect(compose("echo", beat, contextFor("youtube")).fields[0]?.echo?.rows).toBe(5);
  });

  it("puts the echo on a dark frame on a repeat and leaves it out without a key word", () => {
    expect(compose("echo", beat, contextFor("reels", 1)).fields.map((field) => field.tone)).toEqual([
      "ink",
      "highlight",
    ]);
    expect(compose("echo", { ...beat, keyword: undefined }, contextFor("reels")).fields).toEqual([]);
  });
});

function corners(box: Box | undefined): { x: number; y: number }[] {
  if (!box) return [];
  const inset = 1e-3;
  return [
    { x: box.x + inset, y: box.y + inset },
    { x: box.x + box.w - inset, y: box.y + inset },
    { x: box.x + inset, y: box.y + box.h - inset },
    { x: box.x + box.w - inset, y: box.y + box.h - inset },
  ];
}

function covered(field: Field | undefined, point: { x: number; y: number }): boolean {
  return field ? fieldCovers(field, point) : false;
}
