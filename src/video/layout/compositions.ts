import { z } from "zod";
import type { Format, SafeZone } from "../destinations";
import { type Box, BoxSchema } from "../schema/content";
import { round6 } from "./geometry";
import { type Inner, innerArea } from "./safeZones";

export const CompositionSchema = z.enum(["center", "fill", "split", "edge-number", "column", "grid"]);

export type Composition = z.infer<typeof CompositionSchema>;

export const FieldToneSchema = z.enum(["accent", "ink", "highlight", "alt"]);

export type FieldTone = z.infer<typeof FieldToneSchema>;

export const FieldSchema = z.object({
  box: BoxSchema,
  tone: FieldToneSchema,
  from: z.enum(["left", "right", "top", "bottom"]),
  enterMs: z.number(),
  exitMs: z.number(),
});

export type Field = z.infer<typeof FieldSchema>;

// fit: the text is as large as its box allows; spread: also spread over the box's height;
// bleed: larger than its box, running past the box's left edge so the frame crops it.
export const TypeFillSchema = z.enum(["fit", "spread", "bleed"]);

export type TypeFill = z.infer<typeof TypeFillSchema>;

// The beat as a composition sees it: the one lead text, a corner label, and the labels with their sizes and times.
export type Pieces = { leadId?: string; cornerId?: string; supports: Support[] };
export type Support = { id: string; size: Size; enterMs: number; exitMs: number };
export type Placement = { box: Box; fill?: TypeFill };
export type Composed = { placements: Map<string, Placement>; fields: Field[] };

// variant: how many beats before this one used the same composition, so repeats alternate their form.
export type ComposeContext = { format: Format; safeZone: SafeZone; variant: number; durationMs: number };

type Size = { w: number; h: number };
type Arranged = { placements: [string, Placement][]; fields: Field[] };
type Parts = Pieces & { area: Inner; context: ComposeContext };

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

// Places a backdrop beat's lead text and supporting labels, and the color fields that cut the frame.
export function compose(
  composition: Exclude<Composition, "center">,
  pieces: Pieces,
  context: ComposeContext,
): Composed {
  const area = textArea(composition, innerArea(context.safeZone));
  const corner = cornerAt(pieces.cornerId, area);
  const below = corner ? { ...area, top: area.top + cornerHeight + gap } : area;
  const arranged = arrange(composition, { ...pieces, area: below, context });

  return { placements: new Map([...corner, ...arranged.placements]), fields: arranged.fields };
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
    case "edge-number":
      return edgeNumber(parts);
    case "column":
      return column(parts);
    case "grid":
      return grid(parts);
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
    ? stacked(supports, area.left, splitAt + gap, area.bottom, "down")
    : stacked(supports, area.left, area.top, splitAt - gap, "up");

  return {
    placements: [...leadAt(leadId, leadArea, "fit"), ...stack],
    fields: [persistent(field, "accent", "left", context)],
  };
}

// A number so large the frame's left edge crops it; on every other use it sits on an accent field.
function edgeNumber({ leadId, supports, area, context }: Parts): Arranged {
  const { leadArea, stack } = underStack(area, supports);
  const fields = context.variant % 2 === 1 ? [persistent(wholeFrame, "accent", "bottom", context)] : [];

  return { placements: [...leadAt(leadId, leadArea, "bleed"), ...stack], fields };
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

// Labels stack at the bottom of the area, flush left, and the lead takes what is left above them.
function underStack(area: Inner, supports: Support[]): { leadArea: Inner; stack: [string, Placement][] } {
  const height = area.bottom - area.top;
  const stackTop = area.bottom - Math.min(stackHeight(supports), height * maxStackShare);
  const stack = stacked(supports, area.left, stackTop, area.bottom, "down");
  const leadBottom = stack.length > 0 ? stackTop - gap : area.bottom;

  return { leadArea: { ...area, bottom: leadBottom }, stack };
}

function stackHeight(supports: Support[]): number {
  return supports.reduce((sum, piece, index) => sum + piece.size.h + (index > 0 ? gap : 0), 0);
}

// Labels in the order they arrive, from the top down or from the bottom up; what does not fit is left out.
function stacked(
  supports: Support[],
  left: number,
  top: number,
  bottom: number,
  direction: "down" | "up",
): [string, Placement][] {
  const fitting: Support[] = [];
  let used = 0;
  for (const piece of supports) {
    const next = used + (fitting.length > 0 ? gap : 0) + piece.size.h;
    if (next > bottom - top + fitEpsilon) break;
    fitting.push(piece);
    used = next;
  }

  let y = direction === "down" ? top : bottom - used;
  return fitting.map((piece) => {
    const box = boxOf(left, y, piece.size.w, piece.size.h);
    y += piece.size.h + gap;
    return [piece.id, { box }];
  });
}

function leadAt(leadId: string | undefined, area: Inner, fill: TypeFill): [string, Placement][] {
  if (!leadId) return [];
  return [
    [leadId, { box: boxOf(area.left, area.top, area.right - area.left, area.bottom - area.top), fill }],
  ];
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

function boxOf(x: number, y: number, w: number, h: number): Box {
  return { x: round6(x), y: round6(y), w: round6(w), h: round6(h) };
}
