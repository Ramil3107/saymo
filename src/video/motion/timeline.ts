import { Easing } from "remotion";
import type { Curve } from "./tempo";

export type Float = { x: number; y: number; rotate: number };

const curveCache = new Map<string, (t: number) => number>();
const floatPeriodMs = 2800;
const floatPeriodSpread = 0.13;
const floatRampMs = 700;
const floatSideways = 0.5;

export function eased(ms: number, startMs: number, durationMs: number, curve: Curve): number {
  return curveFn(curve)(linear(ms, startMs, durationMs));
}

export function linear(ms: number, startMs: number, durationMs: number): number {
  if (durationMs <= 0) return ms >= startMs ? 1 : 0;

  return Math.min(1, Math.max(0, (ms - startMs) / durationMs));
}

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
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

export function floatAt(ms: number, sinceMs: number, seed: number): Float {
  const since = ms - sinceMs;
  if (since <= 0) return { x: 0, y: 0, rotate: 0 };

  const ramp = smoothstep(Math.min(1, since / floatRampMs));
  const periodMs = floatPeriodMs * (1 + (seed % 3) * floatPeriodSpread);

  return {
    x: ramp * floatSideways * wave(since, periodMs * 1.37, seed),
    y: ramp * wave(since, periodMs, seed + 1),
    rotate: ramp * wave(since, periodMs * 1.71, seed + 2),
  };
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

function wave(ms: number, periodMs: number, phase: number): number {
  return Math.sin((2 * Math.PI * ms) / periodMs + phase);
}
