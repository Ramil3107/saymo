import { z } from "zod";
import { DestinationIdSchema } from "../destinations";
import { RegisterIdSchema } from "../registers";

const lengthToleranceMs = 200;
const maxQuestions = 3;
const minOptions = 2;
const maxOptions = 4;

export const BeatRoleSchema = z.enum(["hook", "setup", "message", "proof", "how", "cta", "sting"]);

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

// Ranges are checked with refine, not min/max, so the JSON schema sent to the model stays simple.
export const CameraSchema = z.object({
  kind: z.enum(["none", "push", "punch-in", "pan"]),
  intensity: z.number().refine((value) => value >= 0 && value <= 1, "intensity must be 0 to 1"),
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
  copy: z.object({ headline: z.string().optional(), sub: z.string().optional() }).optional(),
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

const PlanFieldsSchema = z.object({
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
});

type PlanFields = z.infer<typeof PlanFieldsSchema>;

export const PlanSchema = PlanFieldsSchema.superRefine((plan, ctx) => {
  for (const issue of planIssues(plan)) ctx.addIssue({ code: "custom", ...issue });
});

export type Plan = z.infer<typeof PlanSchema>;

type Issue = { message: string; path: (string | number)[] };

function planIssues(plan: PlanFields): Issue[] {
  return [...shapeIssues(plan), ...lengthIssues(plan), ...beatIdIssues(plan), ...questionIssues(plan)];
}

function shapeIssues(plan: PlanFields): Issue[] {
  const issues: Issue[] = [];

  if (plan.beats.length < 1) {
    issues.push({ message: "A plan needs at least one beat", path: ["beats"] });
  }
  if (plan.questions.length > maxQuestions) {
    issues.push({ message: `A plan has at most ${maxQuestions} questions`, path: ["questions"] });
  }

  return issues;
}

function lengthIssues(plan: PlanFields): Issue[] {
  const beatsMs = plan.beats.reduce((sum, beat) => sum + beat.durationMs, 0);
  if (Math.abs(beatsMs - plan.lengthMs) <= lengthToleranceMs) return [];

  return [{ message: `Beats add up to ${beatsMs} ms but lengthMs is ${plan.lengthMs}`, path: ["lengthMs"] }];
}

function beatIdIssues(plan: PlanFields): Issue[] {
  const seen = new Set<string>();
  const issues: Issue[] = [];

  plan.beats.forEach((beat, index) => {
    if (seen.has(beat.id))
      issues.push({ message: `Duplicate beat id "${beat.id}"`, path: ["beats", index, "id"] });
    seen.add(beat.id);
  });

  return issues;
}

function questionIssues(plan: PlanFields): Issue[] {
  const issues: Issue[] = [];

  plan.questions.forEach((question, index) => {
    const optionCount = question.options.length;
    if (optionCount < minOptions || optionCount > maxOptions) {
      issues.push({
        message: `A question has ${minOptions} to ${maxOptions} options`,
        path: ["questions", index, "options"],
      });
    }
    if (!question.options.includes(question.defaultOption)) {
      issues.push({
        message: "defaultOption must be one of options",
        path: ["questions", index, "defaultOption"],
      });
    }
  });

  return issues;
}
