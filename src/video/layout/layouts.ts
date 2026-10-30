import { z } from "zod";
import type { SafeZone } from "../destinations";
import type { Box } from "../schema/content";
import type { CoverOptions } from "./fitCover";

export const LayoutSchema = z.enum(["free", "panel-top", "panel-side"]);

export type Layout = z.infer<typeof LayoutSchema>;
export type Side = "left" | "right";
export type Fit = "cover" | "card";

type Point = { x: number; y: number };

export const panelShare = 0.46;
export const titleStripShare = 0.26;
const panelZoom = 1.25;
const faceBelowPanelY = 0.72;
const faceBesidePanelX = 0.75;

// Over a card the top panel is only a title strip, so the document below keeps its size.
export function panelBox(layout: Layout, side: Side, fit: Fit = "cover"): Box {
  if (layout === "panel-top") return { x: 0, y: 0, w: 1, h: fit === "card" ? titleStripShare : panelShare };
  if (side === "left") return { x: 0, y: 0, w: panelShare, h: 1 };
  return { x: 1 - panelShare, y: 0, w: panelShare, h: 1 };
}

export function panelSide(faceCenter: Point | undefined): Side {
  if (!faceCenter) return "right";
  return faceCenter.x < 0.5 ? "right" : "left";
}

export function coverOptionsFor(layout: Layout, side: Side): CoverOptions {
  if (layout === "panel-top") {
    return { anchor: { x: 0.5, y: faceBelowPanelY }, zoom: panelZoom, free: { top: panelShare } };
  }
  if (layout === "panel-side") {
    const faceX = side === "left" ? faceBesidePanelX : 1 - faceBesidePanelX;
    return { anchor: { x: faceX, y: 0.5 }, zoom: panelZoom, free: { [side]: panelShare } };
  }
  return {};
}

const cardSideInset = 0.06;
const cardGap = 0.04;
const captionBandTop = 0.66;

// The area a contained shot (a document or a screen) may fill: inside the safe zone, clear of panels and captions.
export function cardArea(layout: Layout, side: Side, safeZone: SafeZone, captionsOn: boolean): Box {
  const left = layout === "panel-side" && side === "left" ? panelShare + cardGap : cardSideInset;
  const right = layout === "panel-side" && side === "right" ? panelShare + cardGap : cardSideInset;
  const top = layout === "panel-top" ? titleStripShare + cardGap : safeZone.top + cardGap;
  const bottom = captionsOn ? 1 - captionBandTop + cardGap : safeZone.bottom + cardGap;

  return { x: left, y: top, w: 1 - left - right, h: 1 - top - bottom };
}

export function isPanelKind(kind: string): boolean {
  return kind === "title-card" || kind === "list";
}
