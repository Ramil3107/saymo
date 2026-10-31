import { fitText } from "@remotion/layout-utils";
import type { CSSProperties } from "react";
import type { StyleKit } from "../style/kit";

const slabRadiusShare = 0.12;
const pillRadius = 999;

export function labelBox(kit: StyleKit, fontSize: number, multiline: boolean): CSSProperties {
  const { label } = kit;
  const pillShape = multiline ? fontSize * 0.9 : pillRadius;

  return {
    backgroundColor: label.background,
    color: label.text,
    boxShadow: label.shadow,
    borderRadius: label.shape === "pill" ? pillShape : fontSize * slabRadiusShare,
    fontFamily: kit.display.family,
    fontWeight: label.shape === "slab" ? kit.display.weight : 700,
  };
}

export function labelText(kit: StyleKit, text: string): string {
  return kit.style.display.upper ? text.toUpperCase() : text;
}

// Labels are measured in the style's display face, which can be much wider than the face the layout estimated with.
export function fittedSize(kit: StyleKit, text: string, maxSize: number, withinWidth: number): number {
  const fitted = fitText({
    text,
    withinWidth,
    fontFamily: kit.display.family,
    fontWeight: kit.display.weight,
  });
  return Math.min(maxSize, fitted.fontSize);
}
