import { z } from "zod";
import type { BackdropId } from "./backdrops";
import type { Exit } from "./motion/moves";
import type { TempoId } from "./motion/tempo";
import type { PaletteId } from "./palettes";
import type { RegisterId } from "./registers";
import type { Accent, CaptionStyle } from "./schema/plan";
import type { Transition } from "./schema/video";
import type { TitleEntrance } from "./type/schedule";

export const StyleIdSchema = z.enum(["bold-pop", "clean-paper"]);

export type StyleId = z.infer<typeof StyleIdSchema>;

export type AccentMark =
  | "burst"
  | "grow-frame"
  | "brackets"
  | "flash-blocks"
  | "sparkles"
  | "selection"
  | "circle"
  | "underline";

export type Flourish = "chevrons" | "ghost-numbers" | "cursor";

export type Tones = { background: string; ink: string; surface: string; muted: string; highlight: string };

export type Style = {
  name: string;
  summary: string;
  tempo: TempoId;
  display: { font: string; weight: number; upper: boolean; labelScale: number; widthScale: number };
  surfaces: { panel: "light" | "dark"; labels: "soft" | "block" };
  tones: Tones;
  backdrops: [BackdropId, ...BackdropId[]];
  captions: CaptionStyle[];
  transitions: Transition[];
  titleEntrances: TitleEntrance[];
  exit: Exit;
  accents: Record<Accent, AccentMark>;
  flourishes: Flourish[];
  palettes: PaletteId[];
};

export const styles: Record<StyleId, Style> = {
  "bold-pop": {
    name: "Bold pop",
    summary:
      "Loud and fast, after Higgsfield: a squared display face in capitals on off-white with pastel color fields, the brand color as a hot accent and a bright highlight, flashes, whips and pixel breaks, chevrons and growing frames. Launches, sales, creators.",
    tempo: "snap",
    display: { font: "unbounded", weight: 900, upper: true, labelScale: 0.85, widthScale: 1.55 },
    surfaces: { panel: "dark", labels: "block" },
    tones: {
      background: "#F6F4EF",
      ink: "#0B0B0F",
      surface: "#FFFFFF",
      muted: "#ECE6EC",
      highlight: "#C8FF2E",
    },
    backdrops: ["glow", "color", "night", "halftone", "pills", "streak"],
    captions: ["bold-center", "keyword-box", "pop", "outline"],
    transitions: ["flash", "whip", "pixelate", "zoom", "cut"],
    titleEntrances: ["type", "punch", "spread", "pop"],
    exit: "smear",
    accents: { celebrate: "burst", frame: "grow-frame", focus: "brackets", stress: "flash-blocks" },
    flourishes: ["chevrons", "ghost-numbers"],
    palettes: ["cobalt", "tangerine", "flamingo", "ultraviolet", "forest"],
  },
  "clean-paper": {
    name: "Clean paper",
    summary:
      "Calm and clear, after motionvid: a neutral sans in sentence case on warm paper with a faint grid, the brand color for keywords and buttons, typing with a caret, panel wipes and dips, sparkles, selection boxes and drawn arrows. Explainers, clinics, SaaS, local business.",
    tempo: "glide",
    display: { font: "inter", weight: 800, upper: false, labelScale: 1, widthScale: 1 },
    surfaces: { panel: "light", labels: "soft" },
    tones: {
      background: "#F3F1EC",
      ink: "#16161B",
      surface: "#FFFFFF",
      muted: "#DCDAD3",
      highlight: "#FF7A2F",
    },
    backdrops: ["paper-grid", "studio", "dots", "sketchbook", "night"],
    captions: ["keyword-box", "karaoke-pill", "marker", "typewriter", "minimal"],
    transitions: ["wipe", "dip", "zoom", "cut"],
    titleEntrances: ["rise", "type", "reveal"],
    exit: "fade",
    accents: { celebrate: "sparkles", frame: "selection", focus: "circle", stress: "underline" },
    flourishes: ["cursor"],
    palettes: ["cobalt", "ocean", "forest", "terracotta", "plum"],
  },
};

export const defaultStyle: Record<RegisterId, StyleId> = {
  "driving-launch": "bold-pop",
  "playful-sale": "bold-pop",
  "serious-clinical": "clean-paper",
  "rich-premium": "clean-paper",
};

// The backdrop a video draws: the one it names when its style lists it, otherwise the style's first.
export function styleBackdrop(style: StyleId, requested?: BackdropId): BackdropId {
  const own = styles[style].backdrops;
  if (requested && own.includes(requested)) return requested;

  return own[0];
}
