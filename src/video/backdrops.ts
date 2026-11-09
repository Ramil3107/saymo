import { z } from "zod";
import type { FieldTone } from "./layout/compositions";

export const BackdropIdSchema = z.enum([
  "glow",
  "paper-grid",
  "color",
  "night",
  "halftone",
  "pills",
  "streak",
  "studio",
  "dots",
  "sketchbook",
]);

export type BackdropId = z.infer<typeof BackdropIdSchema>;

// The field tone that text on a backdrop reads as; a backdrop without one is light, like the style's paper.
export type Ground = Extract<FieldTone, "accent" | "ink">;

export type Backdrop = { name: string; summary: string; ground?: Ground };

export const backdrops: Record<BackdropId, Backdrop> = {
  glow: {
    name: "Glow",
    summary:
      "off-white with soft color glows drifting and film grain: bright and friendly; the bold-pop default",
  },
  "paper-grid": {
    name: "Paper grid",
    summary: "warm paper with a faint grid, darker at the edges: calm and clear; the clean-paper default",
  },
  color: {
    name: "Color",
    summary:
      "the whole frame in the accent with a lighter spot drifting: loud and sure; launches, drops, sales",
    ground: "accent",
  },
  night: {
    name: "Night",
    summary:
      "near-black tinted by the second tone with a soft accent glow: premium and nocturnal; tech, nightlife",
    ground: "ink",
  },
  halftone: {
    name: "Halftone",
    summary: "accent dots sweeping in from a corner on paper: pop and printed; fashion, creators, sales",
  },
  pills: {
    name: "Pills",
    summary:
      "diagonal rows of rounded pills in light palette tints sliding past: playful; apps, queues, plenty",
  },
  streak: {
    name: "Streak",
    summary: "a long blurred accent streak drifting across paper: fast and modern; speed, launches, hooks",
  },
  studio: {
    name: "Studio",
    summary: "cool light grey with light from above: clean and premium; products, SaaS, clinics",
  },
  dots: {
    name: "Dots",
    summary: "a fine dot grid on paper, like a design canvas: precise; SaaS, tools, how it works",
  },
  sketchbook: {
    name: "Sketchbook",
    summary:
      "cream paper inside a thin ruled frame with corner ticks: thoughtful; lessons, explainers, craft",
  },
};
