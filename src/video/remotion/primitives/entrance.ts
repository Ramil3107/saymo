import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Easing as EasingName, RegisterTokens } from "../../registers";
import type { Element } from "../../schema/video";
import { frameToMs } from "../frames";

type Entrance = { visible: boolean; progress: number };

const easingByName: Record<EasingName, (t: number) => number> = {
  snap: Easing.out(Easing.exp),
  settle: Easing.out(Easing.quad),
  drift: Easing.inOut(Easing.sin),
  bounce: Easing.out(Easing.back(1.4)),
};

const entranceStaggerSteps = 6;
const riseFromPx = 40;

export function useEntrance(element: Element, register: RegisterTokens): Entrance {
  const ms = frameToMs(useCurrentFrame());
  const entranceMs = register.staggerMs * entranceStaggerSteps;

  const visible = ms >= element.enterMs && ms < element.exitMs;
  const progress = interpolate(ms, [element.enterMs, element.enterMs + entranceMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easingByName[register.easing],
  });

  return { visible, progress };
}

export function revealStyle(progress: number): CSSProperties {
  return { opacity: progress, transform: `translateY(${(1 - progress) * riseFromPx}px)` };
}
