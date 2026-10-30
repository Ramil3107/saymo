import type { RegisterTokens } from "../registers";
import type { Element, VideoDoc } from "../schema/video";

export type Theme = {
  brand: VideoDoc["brand"];
  register: RegisterTokens;
  fontFamily: string;
};

export type Frame = { width: number; height: number };

export type PrimitiveProps<Kind extends Element["kind"]> = {
  element: Extract<Element, { kind: Kind }>;
  theme: Theme;
  frame: Frame;
};

export const ink = "#08080B";
export const navy = "#0D1D42";
export const paper = "rgba(255, 255, 255, 0.95)";
export const white = "#FFFFFF";

export function textShadow(fontSize: number): string {
  return `0 ${fontSize * 0.04}px ${fontSize * 0.2}px rgba(0,0,0,0.35)`;
}

export function accentColor(theme: Theme): string {
  return theme.brand.colors[1] ?? theme.brand.colors[0] ?? white;
}
