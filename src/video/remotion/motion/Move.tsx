import { type CSSProperties, type ReactNode, useId } from "react";
import { useCurrentFrame } from "remotion";
import { type MoveSpec, type Pose, poseAt } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { frameToMs } from "../frames";

type Props = {
  spec: MoveSpec;
  tempo: Tempo;
  unitPx: number;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
  children: ReactNode;
};

const perspectiveUnits = 8;
const visibleThreshold = 0.01;
const maskClip = "inset(-25% -12% -30% -12%)";
const maskTravel = 1.35;

const centered: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function useMs(): number {
  return frameToMs(useCurrentFrame());
}

export function Move({ spec, tempo, unitPx, style, innerStyle, children }: Props) {
  const ms = useMs();
  const filterId = `smear${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pose = poseAt(ms, spec, tempo);
  if (!pose) return null;

  const masked = spec.enter === "rise" || spec.exit?.move === "sink";
  const smearPx = pose.smear * unitPx;

  return (
    <div style={{ ...style, clipPath: masked ? maskClip : undefined }}>
      {smearPx > visibleThreshold ? <SmearFilter id={filterId} px={smearPx} /> : null}
      <div style={{ ...centered, ...poseStyle(pose, unitPx, filterId), ...innerStyle }}>{children}</div>
    </div>
  );
}

function SmearFilter({ id, px }: { id: string; px: number }) {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <filter id={id} x="-50%" y="-10%" width="200%" height="120%">
        <feGaussianBlur stdDeviation={`${px} 0`} />
      </filter>
    </svg>
  );
}

function poseStyle(pose: Pose, unitPx: number, filterId: string): CSSProperties {
  const filters = [
    pose.blur > visibleThreshold ? `blur(${pose.blur * unitPx}px)` : "",
    pose.smear * unitPx > visibleThreshold ? `url(#${filterId})` : "",
  ].filter((part) => part !== "");

  return {
    opacity: pose.opacity,
    transform: [
      `perspective(${unitPx * perspectiveUnits}px)`,
      `translate(${pose.x * 100}%, ${(pose.y + pose.maskY * maskTravel) * 100}%)`,
      `rotateY(${pose.rotateY}deg)`,
      `scale(${pose.scale})`,
      `scaleX(${pose.scaleX})`,
    ].join(" "),
    filter: filters.length > 0 ? filters.join(" ") : undefined,
    clipPath: pose.clipRight > visibleThreshold ? `inset(0 ${pose.clipRight * 100}% 0 0)` : undefined,
  };
}
