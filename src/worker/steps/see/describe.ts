import { readFile } from "node:fs/promises";
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { assertNotRefused, textOf, withFallback } from "../../../lib/ai/claude";
import type { Metrics } from "../../../lib/metrics";
import { claudeUsd } from "../../../lib/pricing";
import {
  type FrameNote,
  FrameNoteSchema,
  type Shot,
} from "../../../video/schema/content";

type Frame = { tMs: number; path: string };

const inputTokensPerFrame = 1600;
const outputTokensPerFrame = 200;
const framesPerCall = 20;

export function batch<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    batches.push(items.slice(i, i + size));
  return batches;
}

export function selectFramesForDescription(
  frames: Frame[],
  shots: Shot[],
  max = 60,
): Frame[] {
  if (frames.length <= max) return [...frames].sort((a, b) => a.tMs - b.tMs);
  const picked = new Set<Frame>();
  for (const shot of shots) {
    const nearest = frames.reduce((best, frame) =>
      Math.abs(frame.tMs - shot.startMs) < Math.abs(best.tMs - shot.startMs)
        ? frame
        : best,
    );
    picked.add(nearest);
    if (picked.size >= max) break;
  }
  const remaining = frames.filter((frame) => !picked.has(frame));
  const slots = max - picked.size;
  for (let i = 0; i < slots && remaining.length > 0; i += 1) {
    const frame = remaining[Math.floor((i * remaining.length) / slots)];
    if (frame) picked.add(frame);
  }
  return [...picked].sort((a, b) => a.tMs - b.tMs);
}

export function estimateVisionUsd(frameCount: number, model: string): number {
  return claudeUsd(model, {
    input_tokens: frameCount * inputTokensPerFrame,
    output_tokens: frameCount * outputTokensPerFrame,
  });
}

const notesOutput = z.object({ frames: z.array(FrameNoteSchema) });

const instructions = (frames: Frame[]) =>
  [
    "These are keyframes from one video, in order. For each image, in the same order, describe what is in the frame in one sentence,",
    "classify it as face (a person talking to camera), screen (a screen recording or slides) or other, and list any readable on-screen text.",
    `Use these tMs values in order: ${frames.map((frame) => frame.tMs).join(", ")}.`,
  ].join(" ");

async function imageBlock(
  frame: Frame,
): Promise<Anthropic.Beta.BetaImageBlockParam> {
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data: (await readFile(frame.path)).toString("base64"),
    },
  };
}

export async function describeKeyframes(input: {
  client: Anthropic;
  model: string;
  frames: Frame[];
  budgetUsd: number;
  metrics: Metrics;
}): Promise<FrameNote[]> {
  const estimate = estimateVisionUsd(input.frames.length, input.model);
  if (estimate > input.budgetUsd) {
    throw new Error(
      `Vision budget exceeded: ${estimate.toFixed(3)} > ${input.budgetUsd.toFixed(3)}`,
    );
  }
  const notes: FrameNote[] = [];
  for (const frames of batch(input.frames, framesPerCall)) {
    const startedAt = performance.now();
    const message = await input.client.beta.messages.create({
      ...withFallback,
      model: input.model,
      max_tokens: 16000,
      output_config: { effort: "low", format: zodOutputFormat(notesOutput) },
      messages: [
        {
          role: "user",
          content: [
            ...(await Promise.all(frames.map(imageBlock))),
            { type: "text", text: instructions(frames) },
          ],
        },
      ],
    });
    assertNotRefused(message);
    notes.push(...notesOutput.parse(JSON.parse(textOf(message))).frames);
    input.metrics.record({
      step: "see",
      provider: "anthropic",
      ms: Math.round(performance.now() - startedAt),
      usd: claudeUsd(input.model, message.usage),
      detail: { frames: frames.length, model: input.model },
    });
  }
  return notes;
}
