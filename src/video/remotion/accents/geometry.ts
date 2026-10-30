import type { CSSProperties } from "react";
import { mix } from "../../motion/moves";
import { wholePx } from "../motion/pixels";

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
  return {
    position: "absolute",
    left: wholePx(rect.x),
    top: wholePx(rect.y),
    width: wholePx(rect.w),
    height: wholePx(rect.h),
  };
}
