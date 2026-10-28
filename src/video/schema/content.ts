import { z } from "zod";
import { MediaInfoSchema } from "./media";
import { TranscriptSchema } from "./transcript";

const fraction = z.number().min(0).max(1);

export const BoxSchema = z.object({
  x: fraction,
  y: fraction,
  w: fraction,
  h: fraction,
});
export type Box = z.infer<typeof BoxSchema>;

export const ShotSchema = z.object({
  index: z.number(),
  startMs: z.number(),
  endMs: z.number(),
});
export type Shot = z.infer<typeof ShotSchema>;

export const FaceBoxSchema = BoxSchema.extend({ tMs: z.number() });
export type FaceBox = z.infer<typeof FaceBoxSchema>;

export const FrameNoteSchema = z.object({
  tMs: z.number(),
  description: z.string(),
  kind: z.enum(["face", "screen", "other"]),
  onScreenText: z.array(z.string()),
});
export type FrameNote = z.infer<typeof FrameNoteSchema>;

export const ContentMapSchema = z.object({
  source: MediaInfoSchema.extend({ path: z.string() }),
  shots: z.array(ShotSchema),
  faces: z.array(FaceBoxSchema),
  frames: z.array(FrameNoteSchema),
  transcript: TranscriptSchema.nullable(),
});
export type ContentMap = z.infer<typeof ContentMapSchema>;
