import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Easing as EasingName, RegisterTokens } from "../../registers";
import type { Element } from "../../schema/video";
import { frameToMs } from "../frames";

export type MotionPreset = "pop" | "rise";

export type Motion = { visible: boolean; enter: number; exit: number; floatPx: number };

const easingByName: Record<EasingName, (t: number) => number> = {
  snap: Easing.out(Easing.exp),
  settle: Easing.out(Easing.quad),
  drift: Easing.inOut(Easing.sin),
  bounce: Easing.out(Easing.back(1.4)),
};

const popEasing = Easing.out(Easing.back(1.6));
const exitEasing = Easing.in(Easing.quad);

const enterMsByPreset: Record<MotionPreset, number> = { pop: 550, rise: 400 };
const exitMs = 380;
const floatAmplitudePx = 7;
const floatBasePeriodMs = 1250;
const floatPeriodStepMs = 170;
const riseFromPx = 40;
const popFromPx = 28;
const popFromScale = 0.55;
const popFromBlurPx = 10;
const exitToPx = -24;
const exitToScale = 0.88;
const exitToBlurPx = 8;

export function useMotion(element: Element, register: RegisterTokens, preset: MotionPreset): Motion {
  const ms = frameToMs(useCurrentFrame());
  const easing = preset === "pop" ? popEasing : easingByName[register.easing];

  const visible = ms >= element.enterMs && ms < element.exitMs;
  const enter = interpolate(ms, [element.enterMs, element.enterMs + enterMsByPreset[preset]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
  const exit = interpolate(ms, [element.exitMs - exitMs, element.exitMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  return { visible, enter, exit, floatPx: preset === "pop" ? floatAt(ms - element.enterMs, element.id) : 0 };
}

export function motionStyle(motion: Motion, preset: MotionPreset): CSSProperties {
  const { enter, exit, floatPx } = motion;

  if (preset === "rise") {
    return {
      opacity: enter * (1 - exit),
      transform: `translateY(${(1 - enter) * riseFromPx + exit * exitToPx}px)`,
    };
  }

  const scale = popFromScale + (1 - popFromScale) * enter - (1 - exitToScale) * exit;
  const y = (1 - enter) * popFromPx + exit * exitToPx + floatPx;
  const blur = (1 - Math.min(1, enter)) * popFromBlurPx + exit * exitToBlurPx;

  return {
    opacity: Math.min(1, enter) * (1 - exit),
    transform: `translateY(${y}px) scale(${scale})`,
    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
  };
}

function floatAt(sinceEnterMs: number, seed: string): number {
  const variant = hash(seed) % 3;
  const periodMs = floatBasePeriodMs + variant * floatPeriodStepMs;
  const direction = variant % 2 === 0 ? 1 : -1;

  return direction * floatAmplitudePx * Math.sin((2 * Math.PI * sinceEnterMs) / periodMs);
}

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}
