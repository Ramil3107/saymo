import { Easing } from "remotion";
import type { Curve } from "./tempo";

const curveCache = new Map<string, (t: number) => number>();

export function eased(ms: number, startMs: number, durationMs: number, curve: Curve): number {
  if (durationMs <= 0) return ms >= startMs ? 1 : 0;

  const t = Math.min(1, Math.max(0, (ms - startMs) / durationMs));
  return curveFn(curve)(t);
}

export function staggered(startMs: number, index: number, stepMs: number): number {
  return startMs + index * stepMs;
}

export function lettersShown(ms: number, startMs: number, letterCount: number, letterMs: number): number {
  if (ms < startMs) return 0;

  return Math.min(letterCount, Math.floor((ms - startMs) / letterMs) + 1);
}

export function countAt(
  ms: number,
  window: { startMs: number; durationMs: number; stepMs: number },
  range: { from: number; to: number },
  curve: Curve,
): number {
  const stepping = window.stepMs > 0 && ms < window.startMs + window.durationMs;
  const sampleMs = stepping ? quantize(ms, window.startMs, window.stepMs) : ms;
  const progress = eased(sampleMs, window.startMs, window.durationMs, curve);

  return Math.round(range.from + (range.to - range.from) * progress);
}

export function blink(ms: number, periodMs: number): boolean {
  return Math.floor(ms / (periodMs / 2)) % 2 === 0;
}

export function chase(ms: number, periodMs: number, count: number, index: number): boolean {
  return Math.floor(ms / (periodMs / count)) % count === index;
}

export function drift(ms: number, periodMs: number, phase: number): number {
  return Math.sin((2 * Math.PI * ms) / periodMs + phase);
}

function curveFn(curve: Curve): (t: number) => number {
  const key = curve.join(",");
  const cached = curveCache.get(key);
  if (cached) return cached;

  const fn = Easing.bezier(curve[0], curve[1], curve[2], curve[3]);
  curveCache.set(key, fn);
  return fn;
}

function quantize(ms: number, startMs: number, stepMs: number): number {
  if (ms <= startMs) return ms;

  return startMs + Math.floor((ms - startMs) / stepMs) * stepMs;
}
