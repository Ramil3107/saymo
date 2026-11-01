import { z } from "zod";

export const PaletteIdSchema = z.enum([
  "cobalt",
  "tangerine",
  "flamingo",
  "ultraviolet",
  "forest",
  "ocean",
  "terracotta",
  "plum",
]);

export type PaletteId = z.infer<typeof PaletteIdSchema>;

// The colors of a video without a brand, read like a brand's: the accent, a light highlight and a dark second tone.
export type NamedPalette = { name: string; summary: string; colors: string[] };

export const defaultPalette: PaletteId = "cobalt";

export const palettes: Record<PaletteId, NamedPalette> = {
  cobalt: {
    name: "Cobalt",
    summary: "electric blue with sunny yellow: clear and confident; apps, tech, launches",
    colors: ["#2D4BFF", "#FFD23F"],
  },
  tangerine: {
    name: "Tangerine",
    summary: "hot orange with ice blue and navy: energetic and appetizing; food, sales, sport",
    colors: ["#FF5B14", "#BDEBFF", "#1E2A78"],
  },
  flamingo: {
    name: "Flamingo",
    summary: "loud pink with lemon and violet: playful; beauty, fashion, creators",
    colors: ["#FF2E7E", "#FFE45C", "#3A0CA3"],
  },
  ultraviolet: {
    name: "Ultraviolet",
    summary: "violet with acid lime: digital and nocturnal; gaming, drops, music, nightlife",
    colors: ["#6A2BFF", "#C8FF2E", "#13093D"],
  },
  forest: {
    name: "Forest",
    summary: "deep green with pale lime: fresh and healthy; wellness, finance, eco",
    colors: ["#0E8A5B", "#D4F5A3", "#0B3B2C"],
  },
  ocean: {
    name: "Ocean",
    summary: "teal with aqua and navy: calm and trustworthy; clinics, care, services, SaaS",
    colors: ["#0B7A9A", "#9EEBF7", "#0B2545"],
  },
  terracotta: {
    name: "Terracotta",
    summary: "burnt clay with sand and cocoa: warm and handmade; bakeries, cafés, craft, local shops",
    colors: ["#C4512B", "#F7D9A8", "#3E2A1F"],
  },
  plum: {
    name: "Plum",
    summary: "plum with blush: refined; premium, beauty, boutiques, events",
    colors: ["#8E1F5C", "#F5C6DA", "#241034"],
  },
};
