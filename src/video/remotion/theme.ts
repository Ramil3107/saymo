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
export const white = "#FFFFFF";

export function accentColor(theme: Theme): string {
  return theme.brand.colors[1] ?? theme.brand.colors[0] ?? white;
}
