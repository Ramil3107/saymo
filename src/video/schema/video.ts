import { z } from "zod";
import { DestinationIdSchema, FormatSchema } from "../destinations";
import { RegisterIdSchema } from "../registers";
import { BoxSchema } from "./content";
import { CameraSchema } from "./plan";

const ElementBaseSchema = z.object({
  id: z.string(),
  enterMs: z.number(),
  exitMs: z.number(),
  box: BoxSchema,
  emphasis: z.enum(["marker", "underline", "pulse"]).optional(),
});

export const ElementSchema = z.discriminatedUnion("kind", [
  ElementBaseSchema.extend({
    kind: z.literal("headline"),
    text: z.string(),
    sub: z.string().optional(),
  }),
  ElementBaseSchema.extend({ kind: z.literal("chip"), text: z.string() }),
  ElementBaseSchema.extend({
    kind: z.literal("big-number"),
    value: z.string(),
    label: z.string().optional(),
  }),
  ElementBaseSchema.extend({
    kind: z.literal("lower-third"),
    name: z.string(),
    role: z.string().optional(),
  }),
  ElementBaseSchema.extend({
    kind: z.literal("quote"),
    text: z.string(),
    author: z.string().optional(),
  }),
  ElementBaseSchema.extend({ kind: z.literal("sticker"), text: z.string() }),
]);
export type Element = z.infer<typeof ElementSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  background: z.object({
    kind: z.enum(["brand", "solid", "gradient"]),
    color: z.string().optional(),
  }),
  footage: z
    .object({
      assetId: z.string(),
      fromMs: z.number(),
      transform: z.object({ scale: z.number(), x: z.number(), y: z.number() }),
    })
    .optional(),
  camera: CameraSchema.optional(),
  elements: z.array(ElementSchema),
  transition: z.enum(["cut", "fade", "slide"]),
});
export type Scene = z.infer<typeof SceneSchema>;

export const CaptionPageSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  tokens: z.array(
    z.object({ text: z.string(), fromMs: z.number(), toMs: z.number() }),
  ),
});
export type CaptionPage = z.infer<typeof CaptionPageSchema>;

export const VideoDocSchema = z
  .object({
    id: z.string(),
    format: FormatSchema,
    fps: z.literal(30),
    durationMs: z.number(),
    destination: DestinationIdSchema,
    register: RegisterIdSchema,
    brand: z.object({
      colors: z.array(z.string()).min(1).max(3),
      font: z.string(),
      logo: z.string().optional(),
    }),
    assets: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(["video", "audio", "image"]),
        src: z.string(),
        durationMs: z.number().optional(),
      }),
    ),
    scenes: z.array(SceneSchema),
    captions: z
      .object({
        style: z.enum(["karaoke", "box", "pop"]),
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
  })
  .superRefine((doc, ctx) => {
    let expectedStartMs = 0;
    doc.scenes.forEach((scene, index) => {
      if (scene.startMs !== expectedStartMs) {
        ctx.addIssue({
          code: "custom",
          message: `Scene "${scene.id}" must start at ${expectedStartMs} ms, not ${scene.startMs} ms`,
          path: ["scenes", index, "startMs"],
        });
      }
      expectedStartMs = scene.startMs + scene.durationMs;
    });
    if (expectedStartMs !== doc.durationMs) {
      ctx.addIssue({
        code: "custom",
        message: `Scenes end at ${expectedStartMs} ms but durationMs is ${doc.durationMs}`,
        path: ["durationMs"],
      });
    }
  });
export type VideoDoc = z.infer<typeof VideoDocSchema>;
