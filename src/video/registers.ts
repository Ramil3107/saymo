import { z } from "zod";
import type { TempoId } from "./motion/tempo";

export const RegisterIdSchema = z.enum([
  "driving-launch",
  "serious-clinical",
  "rich-premium",
  "playful-sale",
]);

export type RegisterId = z.infer<typeof RegisterIdSchema>;

export type RegisterTokens = {
  sceneMs: [number, number];
  minHoldMs: number;
  tempo: TempoId;
  fontWeight: [number, number];
  maxElements: number;
  maxConcurrentMotions: number;
  musicBpm: [number, number];
};

export const registers: Record<RegisterId, RegisterTokens> = {
  "driving-launch": {
    sceneMs: [1500, 2500],
    minHoldMs: 700,
    tempo: "snap",
    fontWeight: [800, 900],
    maxElements: 4,
    maxConcurrentMotions: 2,
    musicBpm: [110, 130],
  },
  "serious-clinical": {
    sceneMs: [3000, 4500],
    minHoldMs: 1200,
    tempo: "glide",
    fontWeight: [500, 700],
    maxElements: 3,
    maxConcurrentMotions: 1,
    musicBpm: [70, 90],
  },
  "rich-premium": {
    sceneMs: [2500, 4000],
    minHoldMs: 1000,
    tempo: "glide",
    fontWeight: [600, 800],
    maxElements: 5,
    maxConcurrentMotions: 2,
    musicBpm: [80, 100],
  },
  "playful-sale": {
    sceneMs: [1500, 2500],
    minHoldMs: 700,
    tempo: "snap",
    fontWeight: [800, 900],
    maxElements: 6,
    maxConcurrentMotions: 3,
    musicBpm: [120, 140],
  },
};
