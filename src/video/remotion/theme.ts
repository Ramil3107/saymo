import type { SafeZone } from "../destinations";
import type { Tempo } from "../motion/tempo";
import type { RegisterTokens } from "../registers";
import type { Element, VideoDoc } from "../schema/video";

export type Theme = {
  brand: VideoDoc["brand"];
  register: RegisterTokens;
  tempo: Tempo;
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
export const navy = "#0D1D42";
export const paper = "rgba(255, 255, 255, 0.95)";
export const white = "#FFFFFF";

export function textShadow(fontSize: number): string {
  return `0 ${fontSize * 0.04}px ${fontSize * 0.2}px rgba(0,0,0,0.35)`;
}

export function panelColor(theme: Theme): string {
  return darken(theme.brand.colors[0] ?? navy, 0.55);
}

export function darken(hex: string, amount: number): string {
  const channels = hex.replace("#", "").match(/.{2}/g);
  if (!channels || channels.length < 3) return navy;
  const [r, g, b] = channels.map((channel) => Math.round(Number.parseInt(channel, 16) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

export function withAlpha(rgb: string, alpha: number): string {
  return rgb.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
}

export function accentColor(theme: Theme): string {
  return theme.brand.colors[1] ?? theme.brand.colors[0] ?? white;
}
