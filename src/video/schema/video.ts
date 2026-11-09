import { z } from "zod";
import { BackdropIdSchema } from "../backdrops";
import { DestinationIdSchema, FormatSchema } from "../destinations";
import { CompositionSchema, FieldSchema, FieldToneSchema, TypeFillSchema } from "../layout/compositions";
import { RegisterIdSchema } from "../registers";
import { StyleIdSchema } from "../styles";
import { TitleEntranceSchema, TitleLineSchema } from "../type/schedule";
import { BoxSchema } from "./content";
import { AccentSchema, CameraSchema, CaptionStyleSchema, TransitionSchema } from "./plan";

const ElementBaseSchema = z.object({
  id: z.string(),
  enterMs: z.number(),
  exitMs: z.number(),
  box: BoxSchema,
  accent: AccentSchema.optional(),
  on: FieldToneSchema.optional(),
  fill: TypeFillSchema.optional(),
  lineOn: z.array(FieldToneSchema).optional(),
});

export const ElementSchema = z.discriminatedUnion("kind", [
  ElementBaseSchema.extend({ kind: z.literal("headline"), text: z.string(), sub: z.string().optional() }),
  ElementBaseSchema.extend({ kind: z.literal("chip"), text: z.string(), badge: z.string().optional() }),
  ElementBaseSchema.extend({
    kind: z.literal("big-number"),
    value: z.string(),
    label: z.string().optional(),
  }),
  ElementBaseSchema.extend({ kind: z.literal("lower-third"), name: z.string(), role: z.string().optional() }),
  ElementBaseSchema.extend({ kind: z.literal("quote"), text: z.string(), author: z.string().optional() }),
  ElementBaseSchema.extend({ kind: z.literal("sticker"), text: z.string() }),
  ElementBaseSchema.extend({ kind: z.literal("title-card"), text: z.string(), sub: z.string().optional() }),
  ElementBaseSchema.extend({ kind: z.literal("list"), text: z.string(), items: z.array(z.string()) }),
  ElementBaseSchema.extend({
    kind: z.literal("title"),
    lines: z.array(TitleLineSchema).min(1),
    entrance: TitleEntranceSchema,
  }),
  ElementBaseSchema.extend({
    kind: z.literal("counter"),
    value: z.number(),
    decimals: z.number().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    label: z.string().optional(),
  }),
  ElementBaseSchema.extend({ kind: z.literal("corner-label"), text: z.string() }),
]);

export type Element = z.infer<typeof ElementSchema>;

export { type Transition, TransitionSchema } from "./plan";

export const SceneSchema = z.object({
  id: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  background: z.object({
    kind: z.enum(["brand", "solid", "gradient", "style"]),
    color: z.string().optional(),
  }),
  footage: z
    .object({
      assetId: z.string(),
      fromMs: z.number(),
      fit: z.enum(["cover", "card"]).optional(),
      transform: z.object({ scale: z.number(), x: z.number(), y: z.number() }),
    })
    .optional(),
  camera: CameraSchema.optional(),
  composition: CompositionSchema.optional(),
  fields: z.array(FieldSchema).optional(),
  elements: z.array(ElementSchema),
  transition: TransitionSchema,
});

export type Scene = z.infer<typeof SceneSchema>;

export const CaptionPageSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  tokens: z.array(z.object({ text: z.string(), fromMs: z.number(), toMs: z.number() })),
});

export type CaptionPage = z.infer<typeof CaptionPageSchema>;

const AssetSchema = z.object({
  id: z.string(),
  kind: z.enum(["video", "audio", "image"]),
  src: z.string(),
  durationMs: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const VideoDocFieldsSchema = z.object({
  id: z.string(),
  format: FormatSchema,
  fps: z.literal(30),
  durationMs: z.number(),
  destination: DestinationIdSchema,
  register: RegisterIdSchema,
  style: StyleIdSchema.optional(),
  backdrop: BackdropIdSchema.optional(),
  brand: z.object({
    colors: z.array(z.string()).min(1).max(3),
    font: z.string(),
    logo: z.string().optional(),
  }),
  assets: z.array(AssetSchema),
  scenes: z.array(SceneSchema),
  captions: z
    .object({
      style: CaptionStyleSchema,
      keywords: z.array(z.string()),
      pages: z.array(CaptionPageSchema),
    })
    .optional(),
  music: z
    .object({
      assetId: z.string(),
      volume: z.number(),
      duckTo: z.number(),
      speech: z.array(z.object({ startMs: z.number(), endMs: z.number() })),
    })
    .optional(),
  voice: z.array(z.object({ assetId: z.string(), atMs: z.number() })),
});

type VideoDocFields = z.infer<typeof VideoDocFieldsSchema>;

export const VideoDocSchema = VideoDocFieldsSchema.superRefine((doc, ctx) => {
  for (const issue of timelineIssues(doc)) ctx.addIssue({ code: "custom", ...issue });
});

export type VideoDoc = z.infer<typeof VideoDocSchema>;

type Issue = { message: string; path: (string | number)[] };

function timelineIssues(doc: VideoDocFields): Issue[] {
  const issues: Issue[] = [];
  let expectedStartMs = 0;

  doc.scenes.forEach((scene, index) => {
    if (scene.startMs !== expectedStartMs) {
      issues.push({
        message: `Scene "${scene.id}" must start at ${expectedStartMs} ms, not ${scene.startMs} ms`,
        path: ["scenes", index, "startMs"],
      });
    }
    expectedStartMs = scene.startMs + scene.durationMs;
  });

  if (expectedStartMs !== doc.durationMs) {
    issues.push({
      message: `Scenes end at ${expectedStartMs} ms but durationMs is ${doc.durationMs}`,
      path: ["durationMs"],
    });
  }

  return issues;
}
