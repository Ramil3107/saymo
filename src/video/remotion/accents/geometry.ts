import type { CSSProperties } from "react";
import { mix } from "../../motion/moves";

export type Rect = { x: number; y: number; w: number; h: number };

export type Point = { x: number; y: number };

export function mixRect(from: Rect, to: Rect, p: number): Rect {
  return {
    x: mix(from.x, to.x, p),
    y: mix(from.y, to.y, p),
    w: mix(from.w, to.w, p),
    h: mix(from.h, to.h, p),
  };
}

export function rectStyle(rect: Rect): CSSProperties {
  return { position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h };
}
