import { z } from "zod";

export const MediaInfoSchema = z.object({
  durationMs: z.number(),
  width: z.number(),
  height: z.number(),
  fps: z.number(),
  hasAudio: z.boolean(),
  sizeBytes: z.number(),
});
export type MediaInfo = z.infer<typeof MediaInfoSchema>;
