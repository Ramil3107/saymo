import { z } from "zod";

export const TranscriptWordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  speaker: z.string().optional(),
});
export type TranscriptWord = z.infer<typeof TranscriptWordSchema>;

export const TranscriptSchema = z.object({
  language: z.string(),
  text: z.string(),
  words: z.array(TranscriptWordSchema),
});
export type Transcript = z.infer<typeof TranscriptSchema>;
