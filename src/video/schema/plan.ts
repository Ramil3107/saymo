import { z } from "zod";
import { DestinationIdSchema } from "../destinations";
import { RegisterIdSchema } from "../registers";

const lengthToleranceMs = 200;
const maxQuestions = 3;
const minOptions = 2;
const maxOptions = 4;

export const BeatRoleSchema = z.enum([
  "hook",
  "setup",
  "message",
  "proof",
  "how",
  "cta",
  "sting",
]);
export type BeatRole = z.infer<typeof BeatRoleSchema>;

export const OverlayKindSchema = z.enum([
  "headline",
  "chip",
  "big-number",
  "lower-third",
  "quote",
  "sticker",
]);
export type OverlayKind = z.infer<typeof OverlayKindSchema>;

export const CameraSchema = z.object({
  kind: z.enum(["none", "push", "punch-in", "pan"]),
  // refine, not min/max, keeps the JSON schema for structured outputs simple
  intensity: z
    .number()
    .refine((value) => value >= 0 && value <= 1, "intensity must be 0 to 1"),
});
export type Camera = z.infer<typeof CameraSchema>;

export const OverlaySchema = z.object({
  id: z.string(),
  kind: OverlayKindSchema,
  text: z.string(),
  sub: z.string().optional(),
  atMs: z.number(),
  durationMs: z.number(),
  emphasis: z.enum(["marker", "underline", "pulse"]).optional(),
});
export type Overlay = z.infer<typeof OverlaySchema>;

export const BeatSchema = z.object({
  id: z.string(),
  role: BeatRoleSchema,
  startMs: z.number(),
  durationMs: z.number(),
  footage: z.object({ fromMs: z.number(), toMs: z.number() }).optional(),
  camera: CameraSchema.optional(),
  copy: z
    .object({ headline: z.string().optional(), sub: z.string().optional() })
    .optional(),
  overlays: z.array(OverlaySchema),
  voiceText: z.string().optional(),
});
export type Beat = z.infer<typeof BeatSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  defaultOption: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

// Counts are checked here, not as array bounds, to keep the JSON schema for structured outputs simple
export const PlanSchema = z
  .object({
    title: z.string(),
    summary: z.string(),
    cast: z.array(z.object({ name: z.string(), role: z.string().optional() })),
    destination: DestinationIdSchema,
    lengthMs: z.number(),
    register: RegisterIdSchema,
    musicMood: z.string(),
    captions: z.object({
      enabled: z.boolean(),
      style: z.enum(["karaoke", "box", "pop"]),
    }),
    voiceover: z.boolean(),
    beats: z.array(BeatSchema),
    assumptions: z.array(z.string()),
    questions: z.array(QuestionSchema),
  })
  .superRefine((plan, ctx) => {
    const addIssue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: "custom", message, path });

    if (plan.beats.length < 1) {
      addIssue("A plan needs at least one beat", ["beats"]);
    }
    if (plan.questions.length > maxQuestions) {
      addIssue(`A plan has at most ${maxQuestions} questions`, ["questions"]);
    }

    const beatsMs = plan.beats.reduce((sum, beat) => sum + beat.durationMs, 0);
    if (Math.abs(beatsMs - plan.lengthMs) > lengthToleranceMs) {
      addIssue(
        `Beats add up to ${beatsMs} ms but lengthMs is ${plan.lengthMs}`,
        ["lengthMs"],
      );
    }

    const seenIds = new Set<string>();
    plan.beats.forEach((beat, index) => {
      if (seenIds.has(beat.id)) {
        addIssue(`Duplicate beat id "${beat.id}"`, ["beats", index, "id"]);
      }
      seenIds.add(beat.id);
    });

    plan.questions.forEach((question, index) => {
      const optionCount = question.options.length;
      if (optionCount < minOptions || optionCount > maxOptions) {
        addIssue(`A question has ${minOptions} to ${maxOptions} options`, [
          "questions",
          index,
          "options",
        ]);
      }
      if (!question.options.includes(question.defaultOption)) {
        addIssue("defaultOption must be one of options", [
          "questions",
          index,
          "defaultOption",
        ]);
      }
    });
  });
export type Plan = z.infer<typeof PlanSchema>;
