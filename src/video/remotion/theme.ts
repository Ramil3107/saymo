import type { SafeZone } from "../destinations";
import type { Tempo } from "../motion/tempo";
import type { RegisterTokens } from "../registers";
import type { Element, VideoDoc } from "../schema/video";
import { luminance } from "../style/color";
import type { StyleKit } from "./style/kit";

export type Theme = {
  brand: VideoDoc["brand"];
  register: RegisterTokens;
  tempo: Tempo;
  kit: StyleKit;
  fontFamily: string;
  safeZone: SafeZone;
};

export type Frame = { width: number; height: number };

export type PrimitiveProps<Kind extends Element["kind"]> = {
  element: Extract<Element, { kind: Kind }>;
  theme: Theme;
  frame: Frame;
};

export const ink = "#08080B";
export const white = "#FFFFFF";

const lightLuminance = 0.4;

export function textShadow(fontSize: number): string {
  return `0 ${fontSize * 0.04}px ${fontSize * 0.2}px rgba(0,0,0,0.35)`;
}

export function textOn(hex: string): string {
  return (luminance(hex) ?? 0) > lightLuminance ? ink : white;
}

export function accentColor(theme: Theme): string {
  return theme.brand.colors[1] ?? theme.brand.colors[0] ?? white;
}
