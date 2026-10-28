import type { RegisterTokens } from "../registers";
import type { VideoDoc } from "../schema/video";

export type Theme = {
  brand: VideoDoc["brand"];
  register: RegisterTokens;
  fontFamily: string;
};
export type Frame = { width: number; height: number };

export const ink = "#08080B";

export const accentColor = (theme: Theme) =>
  theme.brand.colors[1] ?? theme.brand.colors[0] ?? "#FFFFFF";
