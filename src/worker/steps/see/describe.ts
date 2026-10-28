import { readFile } from "node:fs/promises";
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { assertNotRefused, textOf, withFallback } from "../../../lib/ai/claude";
import { elapsedMs, type Metrics } from "../../../lib/metrics";
import { claudeUsd } from "../../../lib/pricing";
import { type FrameNote, FrameNoteSchema, type Shot } from "../../../video/schema/content";

type Frame = { tMs: number; path: string };

type DescribeInput = {
  client: Anthropic;
  model: string;
  frames: Frame[];
  budgetUsd: number;
  metrics: Metrics;
};

const inputTokensPerFrame = 1600;
const outputTokensPerFrame = 200;
const framesPerCall = 20;
const defaultMaxFrames = 60;
const maxTokens = 16000;

const NotesSchema = z.object({ frames: z.array(FrameNoteSchema) });

export async function describeKeyframes(input: DescribeInput): Promise<FrameNote[]> {
  assertVisionBudget(input.frames.length, input.model, input.budgetUsd);

  const notes: FrameNote[] = [];
  for (const frames of batch(input.frames, framesPerCall))
    notes.push(...(await describeBatch(frames, input)));

  return notes;
}

export function selectFramesForDescription(frames: Frame[], shots: Shot[], max = defaultMaxFrames): Frame[] {
  if (frames.length <= max) return byTime(frames);

  const picked = new Set<Frame>();
  for (const shot of shots) {
    if (picked.size >= max) break;
    picked.add(nearestFrame(frames, shot.startMs));
  }

  const remaining = frames.filter((frame) => !picked.has(frame));
  for (const frame of spreadEvenly(remaining, max - picked.size)) picked.add(frame);

  return byTime([...picked]);
}

export function assertVisionBudget(frameCount: number, model: string, budgetUsd: number): void {
  const estimate = estimateVisionUsd(frameCount, model);
  if (estimate > budgetUsd) {
    throw new Error(`Vision budget exceeded: ${estimate.toFixed(3)} > ${budgetUsd.toFixed(3)}`);
  }
}

export function estimateVisionUsd(frameCount: number, model: string): number {
  return claudeUsd(model, {
    input_tokens: frameCount * inputTokensPerFrame,
    output_tokens: frameCount * outputTokensPerFrame,
  });
}

export function batch<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));

  return batches;
}

async function describeBatch(frames: Frame[], input: DescribeInput): Promise<FrameNote[]> {
  const startedAt = performance.now();
  const images = await Promise.all(frames.map(imageBlock));

  const message = await input.client.beta.messages.create({
    ...withFallback,
    model: input.model,
    max_tokens: maxTokens,
    output_config: { effort: "low", format: zodOutputFormat(NotesSchema) },
    messages: [{ role: "user", content: [...images, { type: "text", text: instructions(frames) }] }],
  });
  assertNotRefused(message);

  input.metrics.record({
    step: "see",
    provider: "anthropic",
    ms: elapsedMs(startedAt),
    usd: claudeUsd(input.model, message.usage),
    detail: { frames: frames.length, model: input.model },
  });

  return NotesSchema.parse(JSON.parse(textOf(message))).frames;
}

function instructions(frames: Frame[]): string {
  return [
    "These are keyframes from one video, in order. For each image, in the same order, describe what is in the frame in one sentence,",
    "classify it as face (a person talking to camera), screen (a screen recording or slides) or other, and list any readable on-screen text.",
    `Use these tMs values in order: ${frames.map((frame) => frame.tMs).join(", ")}.`,
  ].join(" ");
}

async function imageBlock(frame: Frame): Promise<Anthropic.Beta.BetaImageBlockParam> {
  const data = (await readFile(frame.path)).toString("base64");

  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data } };
}

function nearestFrame(frames: Frame[], ms: number): Frame {
  return frames.reduce((best, frame) => (Math.abs(frame.tMs - ms) < Math.abs(best.tMs - ms) ? frame : best));
}

function spreadEvenly(frames: Frame[], count: number): Frame[] {
  const picked: Frame[] = [];
  for (let i = 0; i < count && frames.length > 0; i += 1) {
    const frame = frames[Math.floor((i * frames.length) / count)];
    if (frame) picked.push(frame);
  }

  return picked;
}

function byTime(frames: Frame[]): Frame[] {
  return [...frames].sort((a, b) => a.tMs - b.tMs);
}
