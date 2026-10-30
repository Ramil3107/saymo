import { z } from "zod";
import type { Exit } from "./motion/moves";
import type { TempoId } from "./motion/tempo";
import type { RegisterId } from "./registers";
import type { CaptionStyle } from "./schema/plan";
import type { Transition } from "./schema/video";
import type { TitleEntrance } from "./type/schedule";

export const StyleIdSchema = z.enum(["bold-pop", "clean-paper"]);

export type StyleId = z.infer<typeof StyleIdSchema>;

export type DisplayFont = "unbounded" | "inter";

export type Texture = "blobs" | "grain" | "paper-grid" | "halftone";

export type Accent =
  | "chevrons"
  | "flash-blocks"
  | "grow-frame"
  | "brackets"
  | "burst"
  | "sparkles"
  | "selection"
  | "arrow"
  | "scribble"
  | "cursor";

export type Tones = { background: string; ink: string; surface: string; muted: string; highlight: string };

export type Style = {
  name: string;
  summary: string;
  tempo: TempoId;
  display: { font: DisplayFont; weight: number; upper: boolean };
  tones: Tones;
  textures: Texture[];
  captions: CaptionStyle[];
  transitions: Transition[];
  titleEntrances: TitleEntrance[];
  exit: Exit;
  accents: Accent[];
};

export const styles: Record<StyleId, Style> = {
  "bold-pop": {
    name: "Bold pop",
    summary:
      "Loud and fast, after Higgsfield: a squared display face in capitals on off-white with pastel color fields, the brand color as a hot accent and a bright highlight, flashes, whips and pixel breaks, chevrons and growing frames. Launches, sales, creators.",
    tempo: "snap",
    display: { font: "unbounded", weight: 900, upper: true },
    tones: {
      background: "#F6F4EF",
      ink: "#0B0B0F",
      surface: "#FFFFFF",
      muted: "#ECE6EC",
      highlight: "#C8FF2E",
    },
    textures: ["blobs", "grain"],
    captions: ["bold-center", "keyword-box", "pop", "outline"],
    transitions: ["flash", "whip", "pixelate", "zoom", "cut"],
    titleEntrances: ["type", "punch", "spread", "pop"],
    exit: "smear",
    accents: ["chevrons", "flash-blocks", "grow-frame", "brackets", "burst"],
  },
  "clean-paper": {
    name: "Clean paper",
    summary:
      "Calm and clear, after motionvid: a neutral sans in sentence case on warm paper with a faint grid, the brand color for keywords and buttons, typing with a caret, panel wipes and dips, sparkles, selection boxes and drawn arrows. Explainers, clinics, SaaS, local business.",
    tempo: "glide",
    display: { font: "inter", weight: 800, upper: false },
    tones: {
      background: "#F3F1EC",
      ink: "#16161B",
      surface: "#FFFFFF",
      muted: "#DCDAD3",
      highlight: "#FF7A2F",
    },
    textures: ["paper-grid"],
    captions: ["keyword-box", "karaoke-pill", "marker", "typewriter", "minimal"],
    transitions: ["wipe", "dip", "zoom", "cut"],
    titleEntrances: ["rise", "type", "reveal"],
    exit: "fade",
    accents: ["sparkles", "selection", "arrow", "scribble", "cursor"],
  },
};

export const defaultStyle: Record<RegisterId, StyleId> = {
  "driving-launch": "bold-pop",
  "playful-sale": "bold-pop",
  "serious-clinical": "clean-paper",
  "rich-premium": "clean-paper",
};
