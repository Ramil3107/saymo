import { z } from "zod";
import { destinations } from "../destinations";
import { overlapRatio } from "../layout/keepOut";
import { fitsInBox } from "../layout/textWidth";
import { registers } from "../registers";
import type { Box } from "../schema/content";
import type { Plan } from "../schema/plan";
import type { Element, Scene, VideoDoc } from "../schema/video";

export const QaIssueSchema = z.object({
  code: z.enum([
    "scenes-sum",
    "min-hold",
    "words-on-screen",
    "text-overflow",
    "safe-zone",
    "avoid-zone",
    "voice-overflow",
    "plan-over-cap",
    "plan-over-source",
  ]),
  severity: z.enum(["error", "warning"]),
  message: z.string(),
  sceneId: z.string().optional(),
  elementId: z.string().optional(),
});
export type QaIssue = z.infer<typeof QaIssueSchema>;

export const QaReportSchema = z.object({
  ok: z.boolean(),
  issues: z.array(QaIssueSchema),
});
export type QaReport = z.infer<typeof QaReportSchema>;

const maxWordsOnScreen = 6;
const maxWordsInQuote = 12;
const headlineFontPx = 72;
const bodyFontPx = 40;
const maxLines = 2;
const keepOutErrorShare = 0.5;

export function planWithinLimits(
  plan: Plan,
  sourceDurationMs: number | null,
): QaIssue[] {
  const issues: QaIssue[] = [];
  const cap = destinations[plan.destination].maxLengthMs;
  if (plan.lengthMs > cap) {
    issues.push({
      code: "plan-over-cap",
      severity: "error",
      message: `Plan is ${plan.lengthMs} ms, the ${plan.destination} cap is ${cap} ms`,
    });
  }
  if (sourceDurationMs !== null && plan.lengthMs > sourceDurationMs) {
    issues.push({
      code: "plan-over-source",
      severity: "error",
      message: `Plan is ${plan.lengthMs} ms, the source is ${sourceDurationMs} ms`,
    });
  }
  return issues;
}

function primaryText(element: Element): string {
  switch (element.kind) {
    case "big-number":
      return element.value;
    case "lower-third":
      return element.name;
    default:
      return element.text;
  }
}

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

function maxConcurrentWords(elements: Element[]): number {
  const counted = elements.filter((e) => e.kind !== "quote");
  const moments = counted.flatMap((e) => [e.enterMs, e.exitMs]);
  let max = 0;
  for (const ms of moments) {
    const visible = counted.filter((e) => ms >= e.enterMs && ms < e.exitMs);
    max = Math.max(
      max,
      visible.reduce((sum, e) => sum + wordCount(primaryText(e)), 0),
    );
  }
  return max;
}

function insideSafeZone(
  box: Box,
  zone: { top: number; bottom: number; left: number; right: number },
): boolean {
  const epsilon = 1e-6;
  return (
    box.x >= zone.left - epsilon &&
    box.y >= zone.top - epsilon &&
    box.x + box.w <= 1 - zone.right + epsilon &&
    box.y + box.h <= 1 - zone.bottom + epsilon
  );
}

function sceneIssues(doc: VideoDoc, scene: Scene, avoid: Box[]): QaIssue[] {
  const issues: QaIssue[] = [];
  const safeZone = destinations[doc.destination].safeZone;
  const minHoldMs = registers[doc.register].minHoldMs;
  if (scene.durationMs < minHoldMs) {
    issues.push({
      code: "min-hold",
      severity: "warning",
      message: `Scene lasts ${scene.durationMs} ms, the register holds at least ${minHoldMs} ms`,
      sceneId: scene.id,
    });
  }
  const wordsOnScreen = maxConcurrentWords(scene.elements);
  if (wordsOnScreen > maxWordsOnScreen) {
    issues.push({
      code: "words-on-screen",
      severity: "error",
      message: `${wordsOnScreen} words on screen at once, at most ${maxWordsOnScreen}`,
      sceneId: scene.id,
    });
  }
  for (const element of scene.elements) {
    if (element.kind === "quote" && wordCount(element.text) > maxWordsInQuote) {
      issues.push({
        code: "words-on-screen",
        severity: "error",
        message: `Quote has ${wordCount(element.text)} words, at most ${maxWordsInQuote}`,
        sceneId: scene.id,
        elementId: element.id,
      });
    }
    const fontPx = element.kind === "headline" ? headlineFontPx : bodyFontPx;
    if (
      !fitsInBox(
        primaryText(element),
        element.box,
        doc.format,
        maxLines,
        fontPx,
      )
    ) {
      issues.push({
        code: "text-overflow",
        severity: "warning",
        message: `Text may not fit in ${maxLines} lines at ${fontPx}px`,
        sceneId: scene.id,
        elementId: element.id,
      });
    }
    if (!insideSafeZone(element.box, safeZone)) {
      issues.push({
        code: "safe-zone",
        severity: "error",
        message: "Element leaves the safe zone",
        sceneId: scene.id,
        elementId: element.id,
      });
    }
    const covered = overlapRatio(element.box, avoid);
    if (covered > 0) {
      issues.push({
        code: "avoid-zone",
        severity: covered > keepOutErrorShare ? "error" : "warning",
        message: `Element covers a keep-out zone by ${Math.round(covered * 100)}%`,
        sceneId: scene.id,
        elementId: element.id,
      });
    }
  }
  return issues;
}

function voiceIssues(doc: VideoDoc): QaIssue[] {
  const issues: QaIssue[] = [];
  for (const voice of doc.voice) {
    const asset = doc.assets.find((a) => a.id === voice.assetId);
    const scene = doc.scenes.find(
      (s) => voice.atMs >= s.startMs && voice.atMs < s.startMs + s.durationMs,
    );
    if (!asset?.durationMs || !scene) continue;
    const sceneEndMs = scene.startMs + scene.durationMs;
    if (voice.atMs + asset.durationMs > sceneEndMs) {
      issues.push({
        code: "voice-overflow",
        severity: "error",
        message: `Voice ${voice.assetId} ends ${voice.atMs + asset.durationMs - sceneEndMs} ms after its scene`,
        sceneId: scene.id,
      });
    }
  }
  return issues;
}

export function runQa(
  doc: VideoDoc,
  plan: Plan,
  avoid: Record<string, Box[]>,
  sourceDurationMs: number | null,
): QaReport {
  const issues: QaIssue[] = [...planWithinLimits(plan, sourceDurationMs)];
  const cap = destinations[doc.destination].maxLengthMs;
  if (doc.durationMs > cap && doc.durationMs !== plan.lengthMs) {
    issues.push({
      code: "plan-over-cap",
      severity: "error",
      message: `Video grew to ${doc.durationMs} ms, the ${doc.destination} cap is ${cap} ms`,
    });
  }
  const scenesSum = doc.scenes.reduce((sum, s) => sum + s.durationMs, 0);
  if (scenesSum !== doc.durationMs) {
    issues.push({
      code: "scenes-sum",
      severity: "error",
      message: `Scenes add up to ${scenesSum} ms, the document is ${doc.durationMs} ms`,
    });
  }
  for (const scene of doc.scenes)
    issues.push(...sceneIssues(doc, scene, avoid[scene.id] ?? []));
  issues.push(...voiceIssues(doc));
  return { ok: !issues.some((issue) => issue.severity === "error"), issues };
}
