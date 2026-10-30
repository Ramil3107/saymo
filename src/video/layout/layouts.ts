import { z } from "zod";
import type { Box } from "../schema/content";
import type { CoverOptions } from "./fitCover";

export const LayoutSchema = z.enum(["free", "panel-top", "panel-side"]);

export type Layout = z.infer<typeof LayoutSchema>;
export type Side = "left" | "right";

type Point = { x: number; y: number };

export const panelShare = 0.46;
const panelZoom = 1.25;
const faceBelowPanelY = 0.72;
const faceBesidePanelX = 0.75;

export function panelBox(layout: Layout, side: Side): Box {
  if (layout === "panel-top") return { x: 0, y: 0, w: 1, h: panelShare };
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

export function isPanelKind(kind: string): boolean {
  return kind === "title-card" || kind === "list";
}
