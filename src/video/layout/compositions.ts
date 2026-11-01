import { z } from "zod";
import { type Format, formatSize, type SafeZone } from "../destinations";
import { type Box, BoxSchema } from "../schema/content";
import { insidePolygon, type Point, round6 } from "./geometry";
import { type Inner, innerArea } from "./safeZones";

export const CompositionSchema = z.enum([
  "center",
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
]);

export type Composition = z.infer<typeof CompositionSchema>;

export const FieldToneSchema = z.enum(["accent", "ink", "highlight", "alt", "surface"]);

export type FieldTone = z.infer<typeof FieldToneSchema>;

export const FieldSchema = z.object({
  box: BoxSchema,
  tone: FieldToneSchema,
  from: z.enum(["left", "right", "top", "bottom"]),
  enterMs: z.number(),
  exitMs: z.number(),
  // The field's outline as points inside its box, from 0 to 1; the whole box when absent.
  outline: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  // A card: it lands with the style's corners and shadow instead of sweeping in.
  raised: z.boolean().optional(),
  // A word repeated in outlined rows across the box instead of a fill.
  echo: z.object({ text: z.string(), rows: z.number() }).optional(),
});

export type Field = z.infer<typeof FieldSchema>;

// fit: the text is as large as its box allows; spread: also spread over the box's height; rows: each line in a
// row of its own, the rows sharing the box's height.
export const TypeFillSchema = z.enum(["fit", "spread", "rows"]);

export type TypeFill = z.infer<typeof TypeFillSchema>;

// The beat as a composition sees it: the one lead text with its line count and key word, a corner label, and the
// labels with their sizes and times.
export type Pieces = {
  leadId?: string;
  leadLines?: number;
  keyword?: string;
  cornerId?: string;
  supports: Support[];
};
export type Support = { id: string; size: Size; enterMs: number; exitMs: number };
export type Placement = { box: Box; fill?: TypeFill; align?: Flush; lineOn?: FieldTone[] };
export type Composed = { placements: Map<string, Placement>; fields: Field[] };

// variant: how many beats before this one used the same composition, so repeats alternate their form.
export type ComposeContext = { format: Format; safeZone: SafeZone; variant: number; durationMs: number };

type Size = { w: number; h: number };
type Flush = "left" | "right";
type Arranged = { placements: [string, Placement][]; fields: Field[] };
type Parts = Pieces & { area: Inner; context: ComposeContext };
type Stack = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  direction: "down" | "up";
  flush: Flush;
};

const gap = 0.03;
const fitEpsilon = 1e-9;
const cornerWidthShare = 0.44;
const cornerHeight = 0.05;
const maxStackShare = 0.4;
const splitAt = 0.5;
const columnBandShare = 0.2;
const gridLeadShare = 0.24;
const maxTiles = 4;
const tileTones: FieldTone[] = ["accent", "ink", "highlight", "alt"];
const wholeFrame: Box = { x: 0, y: 0, w: 1, h: 1 };
const bandRowShareOfWidth = 0.3;
const bandGap = 0.012;
const bandStaggerMs = 90;
const bandTones: FieldTone[][] = [
  ["accent", "ink", "highlight"],
  ["highlight", "accent", "surface"],
];
const cutHigh = 0.4;
const cutLow = 0.6;
const cardPad = 0.05;
const stackLeadWidth = 0.8;
const stackLeadHeight = 0.42;
const echoRows: Record<Format, number> = { "9:16": 9, "1:1": 6, "16:9": 5 };

// Places a backdrop beat's lead text and supporting labels, and the color fields that cut the frame.
export function compose(
  composition: Exclude<Composition, "center">,
  pieces: Pieces,
  context: ComposeContext,
): Composed {
  const area = textArea(composition, innerArea(context.safeZone));
  const corner = cornerAt(pieces.cornerId, area);
  const below = corner.length > 0 ? { ...area, top: area.top + cornerHeight + gap } : area;
  const arranged = arrange(composition, { ...pieces, area: below, context });

  return { placements: new Map([...corner, ...arranged.placements]), fields: arranged.fields };
}

// Whether text at a point sits on the field's color: an echo is only outlines, an outlined field covers its outline.
export function fieldCovers(field: Field, point: Point): boolean {
  const { box, outline } = field;
  if (field.echo) return false;
  if (point.x < box.x || point.x > box.x + box.w || point.y < box.y || point.y > box.y + box.h) return false;
  if (!outline) return true;

  return insidePolygon(outline, { x: (point.x - box.x) / box.w, y: (point.y - box.y) / box.h });
}

// The area type may use: inside the safe zone, and clear of the column's band.
function textArea(composition: Exclude<Composition, "center">, inner: Inner): Inner {
  if (composition !== "column") return inner;
  return { ...inner, left: Math.max(inner.left, columnBandShare + gap) };
}

// A corner label takes the top line of the text area, and everything else starts below it.
function cornerAt(cornerId: string | undefined, area: Inner): [string, Placement][] {
  if (!cornerId) return [];
  const width = (area.right - area.left) * cornerWidthShare;
  return [[cornerId, { box: boxOf(area.left, area.top, width, cornerHeight) }]];
}

function arrange(composition: Exclude<Composition, "center">, parts: Parts): Arranged {
  switch (composition) {
    case "fill":
      return fill(parts);
    case "split":
      return split(parts);
    case "giant-number":
      return giantNumber(parts);
    case "column":
      return column(parts);
    case "grid":
      return grid(parts);
    case "bands":
      return bands(parts);
    case "diagonal":
      return diagonal(parts);
    case "inset":
      return inset(parts);
    case "corner-stack":
      return cornerStack(parts);
    case "echo":
      return echo(parts);
  }
}

// The title's lines spread over the whole frame; on every other use the frame turns dark.
function fill({ leadId, supports, area, context }: Parts): Arranged {
  const { leadArea, stack } = underStack(area, supports);
  const fields = context.variant % 2 === 1 ? [persistent(wholeFrame, "ink", "top", context)] : [];

  return { placements: [...leadAt(leadId, leadArea, "spread"), ...stack], fields };
}

// A color field covers half the frame and holds the title; the labels sit on the other half.
function split({ leadId, supports, area, context }: Parts): Arranged {
  const onTop = context.variant % 2 === 0;
  const field = onTop ? { x: 0, y: 0, w: 1, h: splitAt } : { x: 0, y: splitAt, w: 1, h: 1 - splitAt };
  const leadArea = onTop ? { ...area, bottom: splitAt - gap } : { ...area, top: splitAt + gap };
  const stack = onTop
    ? stacked(supports, { ...area, top: splitAt + gap, direction: "down", flush: "left" })
    : stacked(supports, { ...area, bottom: splitAt - gap, direction: "up", flush: "left" });

  return {
    placements: [...leadAt(leadId, leadArea, "fit"), ...stack],
    fields: [persistent(field, "accent", "left", context)],
  };
}

// A number as wide as the text area, whole in the frame; on every other use it sits on an accent field.
function giantNumber({ leadId, supports, area, context }: Parts): Arranged {
  const { leadArea, stack } = underStack(area, supports);
  const fields = context.variant % 2 === 1 ? [persistent(wholeFrame, "accent", "bottom", context)] : [];

  return { placements: [...leadAt(leadId, leadArea, "fit"), ...stack], fields };
}

// A color band runs down the left edge, and the type stands flush against it.
function column({ leadId, supports, area, context }: Parts): Arranged {
  const band = { x: 0, y: 0, w: columnBandShare, h: 1 };
  const { leadArea, stack } = underStack(area, supports);
  const tone: FieldTone = context.variant % 2 === 0 ? "ink" : "accent";

  return {
    placements: [...leadAt(leadId, leadArea, "fit"), ...stack],
    fields: [persistent(band, tone, "top", context)],
  };
}

// The labels become colored tiles, each appearing and leaving with its label, under a short title.
function grid({ leadId, supports, area, context }: Parts): Arranged {
  const tiles = supports.slice(0, maxTiles);
  const leadBottom = area.top + (area.bottom - area.top) * gridLeadShare;
  const tileArea = leadId ? { ...area, top: leadBottom + gap } : area;
  const cells = gridCells(tiles.length, tileArea, context.format);

  const placements = tiles.flatMap((tile, index): [string, Placement][] => {
    const cell = cells[index];
    return cell ? [[tile.id, { box: cell }]] : [];
  });
  const fields = tiles.flatMap((tile, index): Field[] => {
    const cell = cells[index];
    const tone = tileTones[(index + context.variant) % tileTones.length] ?? "accent";
    return cell ? [{ box: cell, tone, from: "left", enterMs: tile.enterMs, exitMs: tile.exitMs }] : [];
  });

  return { placements: [...leadAt(leadId, { ...area, bottom: leadBottom }, "fit"), ...placements], fields };
}

// Every title line sits in a full-width band of its own; on every other use the frame turns dark under the bands.
function bands({ leadId, leadLines = 1, supports, area, context }: Parts): Arranged {
  const { leadArea, stack } = underStack(area, supports);
  const row = Math.min((leadArea.bottom - leadArea.top) / leadLines, bandRow(area, context.format));
  const top = (leadArea.top + leadArea.bottom - row * leadLines) / 2;
  const dark = context.variant % 2 === 1;
  const tones = bandTones[dark ? 1 : 0] ?? tileTones;
  const rows = Array.from({ length: leadLines }, (_, index) => bandAt(index, top + index * row, row, tones));

  const lead: Placement = {
    box: boxOf(area.left, top, area.right - area.left, row * leadLines),
    fill: "rows",
    align: dark ? "right" : "left",
    lineOn: rows.map((band) => band.tone),
  };
  const frame = dark ? [persistent(wholeFrame, "ink", "top", context)] : [];
  const fields = [...frame, ...rows.map((band) => ({ ...band, exitMs: context.durationMs }))];

  return { placements: [...placed(leadId, lead), ...stack], fields };
}

// A band is at most about a third of the text area's width tall, so it hugs its line.
function bandRow(area: Inner, format: Format): number {
  return (area.right - area.left) * bandRowShareOfWidth * aspect(format);
}

function bandAt(index: number, top: number, row: number, tones: FieldTone[]): Omit<Field, "exitMs"> {
  return {
    box: boxOf(0, top + bandGap / 2, 1, row - bandGap),
    tone: tones[index % tones.length] ?? "accent",
    from: index % 2 === 0 ? "left" : "right",
    enterMs: index * bandStaggerMs,
  };
}

// A field over the top of the frame ends in a slanted cut: the title above the cut, the labels under its high end.
// On every other use the cut falls the other way.
function diagonal({ leadId, supports, area, context }: Parts): Arranged {
  const rising = context.variant % 2 === 0;
  const cutAt = (x: number) => (rising ? cutLow - (cutLow - cutHigh) * x : cutHigh + (cutLow - cutHigh) * x);
  const widest = Math.max(0, ...supports.map((piece) => piece.size.w));
  const stackTop = cutAt(rising ? area.right - widest : area.left + widest) + gap;
  const leadArea = { ...area, bottom: Math.min(cutAt(area.left), cutAt(area.right)) - gap };
  const flush: Flush = rising ? "right" : "left";

  const high = cutHigh / cutLow;
  const outline = rising
    ? [point(0, 0), point(1, 0), point(1, high), point(0, 1)]
    : [point(0, 0), point(1, 0), point(1, 1), point(0, high)];
  const field = {
    ...persistent(boxOf(0, 0, 1, cutLow), rising ? "accent" : "alt", "left", context),
    outline,
  };

  return {
    placements: [
      ...leadAt(leadId, leadArea, "fit"),
      ...stacked(supports, { ...area, top: stackTop, direction: "down", flush }),
    ],
    fields: [field],
  };
}

function point(x: number, y: number): Point {
  return { x, y: round6(y) };
}

// A raised card holds the title inside a frame of color; on every other use a dark card lands on the backdrop.
function inset({ leadId, supports, area, context }: Parts): Arranged {
  const { leadArea, stack } = underStack(area, supports);
  const card = boxOfInner(leadArea);
  const padY = cardPad * aspect(context.format);
  const inside = {
    left: leadArea.left + cardPad,
    right: leadArea.right - cardPad,
    top: leadArea.top + padY,
    bottom: leadArea.bottom - padY,
  };
  const framed = context.variant % 2 === 0;
  const raised = { ...persistent(card, framed ? "surface" : "ink", "bottom", context), raised: true };
  const fields = framed ? [persistent(wholeFrame, "accent", "top", context), raised] : [raised];

  return { placements: [...leadAt(leadId, inside, "fit"), ...stack], fields };
}

// The title stacks in a corner on a block of color that runs off the frame, the labels in the opposite corner.
// On every other use the title takes the bottom-right corner and the labels the top-left.
function cornerStack({ leadId, supports, area, context }: Parts): Arranged {
  const topLeft = context.variant % 2 === 0;
  const width = (area.right - area.left) * stackLeadWidth;
  const height = (area.bottom - area.top) * stackLeadHeight;
  const lead = topLeft
    ? { left: area.left, right: area.left + width, top: area.top, bottom: area.top + height }
    : { left: area.right - width, right: area.right, top: area.bottom - height, bottom: area.bottom };
  const padY = gap * aspect(context.format);
  const block = topLeft
    ? boxOf(0, 0, lead.right + gap, lead.bottom + padY)
    : boxOf(lead.left - gap, lead.top - padY, 1 - lead.left + gap, 1 - lead.top + padY);
  const stack = topLeft
    ? stacked(supports, { ...area, top: block.h + gap, direction: "up", flush: "right" })
    : stacked(supports, { ...area, bottom: block.y - gap, direction: "down", flush: "left" });
  const placement: Placement = { box: boxOfInner(lead), fill: "fit", align: topLeft ? "left" : "right" };

  return {
    placements: [...placed(leadId, placement), ...stack],
    fields: [persistent(block, topLeft ? "accent" : "alt", topLeft ? "left" : "right", context)],
  };
}

// The title's key word repeats in outlined rows over the whole frame, the title over it; on every other use the
// frame turns dark and the outlines take the highlight.
function echo({ leadId, keyword, supports, area, context }: Parts): Arranged {
  const { leadArea, stack } = underStack(area, supports);
  const dark = context.variant % 2 === 1;
  const tone: FieldTone = dark ? "highlight" : "accent";
  const echoed = { text: keyword ?? "", rows: echoRows[context.format] };
  const pattern = keyword ? [{ ...persistent(wholeFrame, tone, "left", context), echo: echoed }] : [];
  const frame = dark ? [persistent(wholeFrame, "ink", "top", context)] : [];

  return { placements: [...leadAt(leadId, leadArea, "fit"), ...stack], fields: [...frame, ...pattern] };
}

// Labels stack at the bottom of the area, flush left, and the lead takes what is left above them.
function underStack(area: Inner, supports: Support[]): { leadArea: Inner; stack: [string, Placement][] } {
  const height = area.bottom - area.top;
  const stackTop = area.bottom - Math.min(stackHeight(supports), height * maxStackShare);
  const stack = stacked(supports, { ...area, top: stackTop, direction: "down", flush: "left" });
  const leadBottom = stack.length > 0 ? stackTop - gap : area.bottom;

  return { leadArea: { ...area, bottom: leadBottom }, stack };
}

function stackHeight(supports: Support[]): number {
  return supports.reduce((sum, piece, index) => sum + piece.size.h + (index > 0 ? gap : 0), 0);
}

// Labels in the order they arrive, from the top down or from the bottom up, flush to one side; what does not fit
// is left out.
function stacked(supports: Support[], stack: Stack): [string, Placement][] {
  const fitting: Support[] = [];
  let used = 0;
  for (const piece of supports) {
    const next = used + (fitting.length > 0 ? gap : 0) + piece.size.h;
    if (next > stack.bottom - stack.top + fitEpsilon) break;
    fitting.push(piece);
    used = next;
  }

  let y = stack.direction === "down" ? stack.top : stack.bottom - used;
  return fitting.map((piece) => {
    const x = stack.flush === "left" ? stack.left : stack.right - piece.size.w;
    const box = boxOf(x, y, piece.size.w, piece.size.h);
    y += piece.size.h + gap;
    return [piece.id, { box }];
  });
}

function leadAt(leadId: string | undefined, area: Inner, fill: TypeFill): [string, Placement][] {
  return placed(leadId, { box: boxOfInner(area), fill });
}

function placed(id: string | undefined, placement: Placement): [string, Placement][] {
  return id ? [[id, placement]] : [];
}

function persistent(box: Box, tone: FieldTone, from: Field["from"], context: ComposeContext): Field {
  return { box, tone, from, enterMs: 0, exitMs: context.durationMs };
}

// Tall frames stack two tiles and pair the rest; square frames hold three in a row; wide frames one row.
function gridCells(count: number, area: Inner, format: Format): Box[] {
  if (count === 0) return [];
  const columns = Math.min(count, columnsFor(count, format));
  const rows = Math.ceil(count / columns);
  const width = area.right - area.left;
  const cellW = (width - gap * (columns - 1)) / columns;
  const cellH = (area.bottom - area.top - gap * (rows - 1)) / rows;

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const lastAlone = index === count - 1 && col === 0 && count % columns !== 0;
    const x = area.left + col * (cellW + gap);
    return boxOf(x, area.top + row * (cellH + gap), lastAlone ? width : cellW, cellH);
  });
}

function columnsFor(count: number, format: Format): number {
  if (format === "16:9") return count;
  if (format === "1:1") return count <= 3 ? count : 2;
  return count <= 2 ? 1 : 2;
}

// How many frame heights one frame width makes, to turn a horizontal share into a vertical one.
function aspect(format: Format): number {
  const { width, height } = formatSize(format);
  return width / height;
}

function boxOfInner(area: Inner): Box {
  return boxOf(area.left, area.top, area.right - area.left, area.bottom - area.top);
}

function boxOf(x: number, y: number, w: number, h: number): Box {
  return { x: round6(x), y: round6(y), w: round6(w), h: round6(h) };
}
