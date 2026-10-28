import { z } from "zod";

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
  staggerMs: number;
  easing: "snap" | "settle" | "drift" | "bounce";
  overshoot: number;
  fontWeight: [number, number];
  maxElements: number;
  maxConcurrentMotions: number;
  musicBpm: [number, number];
};

export const registers: Record<RegisterId, RegisterTokens> = {
  "driving-launch": {
    sceneMs: [1500, 2500],
    minHoldMs: 700,
    staggerMs: 40,
    easing: "snap",
    overshoot: 1.4,
    fontWeight: [800, 900],
    maxElements: 4,
    maxConcurrentMotions: 2,
    musicBpm: [110, 130],
  },
  "serious-clinical": {
    sceneMs: [3000, 4500],
    minHoldMs: 1200,
    staggerMs: 80,
    easing: "settle",
    overshoot: 0,
    fontWeight: [500, 700],
    maxElements: 3,
    maxConcurrentMotions: 1,
    musicBpm: [70, 90],
  },
  "rich-premium": {
    sceneMs: [2500, 4000],
    minHoldMs: 1000,
    staggerMs: 60,
    easing: "drift",
    overshoot: 0.6,
    fontWeight: [600, 800],
    maxElements: 5,
    maxConcurrentMotions: 2,
    musicBpm: [80, 100],
  },
  "playful-sale": {
    sceneMs: [1500, 2500],
    minHoldMs: 700,
    staggerMs: 50,
    easing: "bounce",
    overshoot: 1.8,
    fontWeight: [800, 900],
    maxElements: 6,
    maxConcurrentMotions: 3,
    musicBpm: [120, 140],
  },
};
