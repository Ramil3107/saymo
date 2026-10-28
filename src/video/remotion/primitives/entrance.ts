import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { RegisterTokens } from "../../registers";
import type { Element } from "../../schema/video";
import { frameToMs } from "../frames";

const easingByRegister: Record<
  RegisterTokens["easing"],
  (t: number) => number
> = {
  snap: Easing.out(Easing.exp),
  settle: Easing.out(Easing.quad),
  drift: Easing.inOut(Easing.sin),
  bounce: Easing.out(Easing.back(1.4)),
};

export function useEntrance(
  element: Element,
  register: RegisterTokens,
): { visible: boolean; progress: number } {
  const ms = frameToMs(useCurrentFrame());
  const entranceMs = register.staggerMs * 6;
  const visible = ms >= element.enterMs && ms < element.exitMs;
  const progress = interpolate(
    ms,
    [element.enterMs, element.enterMs + entranceMs],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easingByRegister[register.easing],
    },
  );
  return { visible, progress };
}

export const revealStyle = (progress: number): React.CSSProperties => ({
  opacity: progress,
  transform: `translateY(${(1 - progress) * 40}px)`,
});
