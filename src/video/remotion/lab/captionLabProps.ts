import { z } from "zod";
import { RegisterIdSchema } from "../../registers";
import { TranscriptWordSchema } from "../../schema/transcript";

export const CaptionLabPropsSchema = z.object({
  footage: z.string(),
  durationMs: z.number().positive(),
  words: z.array(TranscriptWordSchema),
  keywords: z.array(z.string()),
  colors: z.array(z.string()).min(1),
  register: RegisterIdSchema,
});

export type CaptionLabProps = z.infer<typeof CaptionLabPropsSchema>;

export const captionLabDefaults: CaptionLabProps = {
  footage: "caption-footage.mp4",
  durationMs: 8000,
  words: [],
  keywords: [],
  colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"],
  register: "serious-clinical",
};
