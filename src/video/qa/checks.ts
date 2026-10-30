import { z } from "zod";
import { destinations, type SafeZone } from "../destinations";
import { intersectionArea } from "../layout/geometry";
import { keepOutErrorShare, overlapRatio } from "../layout/keepOut";
import { isPanelKind } from "../layout/layouts";
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
    "elements-overlap",
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

type Severity = QaIssue["severity"];
type AvoidZones = Record<string, Box[]>;

const maxWordsOnScreen = 6;
const maxWordsInQuote = 12;
const headlineFontPx = 72;
const bodyFontPx = 40;
const maxLines = 2;
const safeZoneEpsilon = 1e-6;

export function planWithinLimits(plan: Plan, sourceDurationMs: number | null): QaIssue[] {
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

export function runQa(
  doc: VideoDoc,
  plan: Plan,
  avoid: AvoidZones,
  sourceDurationMs: number | null,
): QaReport {
  const issues = [
    ...planWithinLimits(plan, sourceDurationMs),
    ...documentIssues(doc, plan),
    ...doc.scenes.flatMap((scene) => sceneIssues(doc, scene, avoid[scene.id] ?? [])),
    ...voiceIssues(doc),
  ];

  return { ok: !issues.some((issue) => issue.severity === "error"), issues };
}

function documentIssues(doc: VideoDoc, plan: Plan): QaIssue[] {
  const issues: QaIssue[] = [];
  const cap = destinations[doc.destination].maxLengthMs;
  const scenesMs = doc.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);

  if (doc.durationMs > cap && doc.durationMs !== plan.lengthMs) {
    issues.push({
      code: "plan-over-cap",
      severity: "error",
      message: `Video grew to ${doc.durationMs} ms, the ${doc.destination} cap is ${cap} ms`,
    });
  }
  if (scenesMs !== doc.durationMs) {
    issues.push({
      code: "scenes-sum",
      severity: "error",
      message: `Scenes add up to ${scenesMs} ms, the document is ${doc.durationMs} ms`,
    });
  }

  return issues;
}

function sceneIssues(doc: VideoDoc, scene: Scene, avoid: Box[]): QaIssue[] {
  const issues: QaIssue[] = [];
  const minHoldMs = registers[doc.register].minHoldMs;
  const wordsOnScreen = maxConcurrentWords(scene.elements);

  if (scene.durationMs < minHoldMs) {
    issues.push({
      code: "min-hold",
      severity: "warning",
      message: `Scene lasts ${scene.durationMs} ms, the register holds at least ${minHoldMs} ms`,
      sceneId: scene.id,
    });
  }
  if (wordsOnScreen > maxWordsOnScreen) {
    issues.push({
      code: "words-on-screen",
      severity: "error",
      message: `${wordsOnScreen} words on screen at once, at most ${maxWordsOnScreen}`,
      sceneId: scene.id,
    });
  }

  return [
    ...issues,
    ...scene.elements.flatMap((element) => elementIssues(doc, scene, element, avoid)),
    ...overlapIssues(scene),
  ];
}

function overlapIssues(scene: Scene): QaIssue[] {
  const issues: QaIssue[] = [];

  scene.elements.forEach((element, index) => {
    for (const other of scene.elements.slice(index + 1)) {
      if (!sharesTime(element, other) || intersectionArea(element.box, other.box) === 0) continue;
      issues.push({
        code: "elements-overlap",
        severity: "error",
        message: `Elements "${element.id}" and "${other.id}" overlap`,
        sceneId: scene.id,
        elementId: element.id,
      });
    }
  });

  return issues;
}

function sharesTime(a: Element, b: Element): boolean {
  return a.enterMs < b.exitMs && b.enterMs < a.exitMs;
}

function elementIssues(doc: VideoDoc, scene: Scene, element: Element, avoid: Box[]): QaIssue[] {
  const issues: QaIssue[] = [];
  const report = (code: QaIssue["code"], severity: Severity, message: string) =>
    issues.push({ code, severity, message, sceneId: scene.id, elementId: element.id });

  if (element.kind === "quote" && wordCount(element.text) > maxWordsInQuote) {
    report(
      "words-on-screen",
      "error",
      `Quote has ${wordCount(element.text)} words, at most ${maxWordsInQuote}`,
    );
  }

  const fontPx = element.kind === "headline" ? headlineFontPx : bodyFontPx;
  if (!fitsInBox(primaryText(element), element.box, doc.format, maxLines, fontPx)) {
    report("text-overflow", "warning", `Text may not fit in ${maxLines} lines at ${fontPx}px`);
  }

  if (!isPanelKind(element.kind) && !insideSafeZone(element.box, destinations[doc.destination].safeZone)) {
    report("safe-zone", "error", "Element leaves the safe zone");
  }

  const covered = overlapRatio(element.box, avoid);
  if (covered > 0) {
    const severity: Severity = covered > keepOutErrorShare ? "error" : "warning";
    report("avoid-zone", severity, `Element covers a keep-out zone by ${Math.round(covered * 100)}%`);
  }

  return issues;
}

function voiceIssues(doc: VideoDoc): QaIssue[] {
  const issues: QaIssue[] = [];

  for (const voice of doc.voice) {
    const asset = doc.assets.find((candidate) => candidate.id === voice.assetId);
    const scene = doc.scenes.find((candidate) => startsInside(voice.atMs, candidate));
    if (!asset?.durationMs || !scene) continue;

    const voiceEndMs = voice.atMs + asset.durationMs;
    const sceneEndMs = scene.startMs + scene.durationMs;
    if (voiceEndMs > sceneEndMs) {
      issues.push({
        code: "voice-overflow",
        severity: "error",
        message: `Voice ${voice.assetId} ends ${voiceEndMs - sceneEndMs} ms after its scene`,
        sceneId: scene.id,
      });
    }
  }

  return issues;
}

function maxConcurrentWords(elements: Element[]): number {
  const counted = elements.filter((element) => element.kind !== "quote" && element.kind !== "list");
  const moments = counted.flatMap((element) => [element.enterMs, element.exitMs]);

  const wordsAt = (ms: number) =>
    counted
      .filter((element) => ms >= element.enterMs && ms < element.exitMs)
      .reduce((sum, element) => sum + wordCount(primaryText(element)), 0);

  return Math.max(0, ...moments.map(wordsAt));
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

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function insideSafeZone(box: Box, zone: SafeZone): boolean {
  return (
    box.x >= zone.left - safeZoneEpsilon &&
    box.y >= zone.top - safeZoneEpsilon &&
    box.x + box.w <= 1 - zone.right + safeZoneEpsilon &&
    box.y + box.h <= 1 - zone.bottom + safeZoneEpsilon
  );
}

function startsInside(ms: number, scene: Scene): boolean {
  return ms >= scene.startMs && ms < scene.startMs + scene.durationMs;
}
