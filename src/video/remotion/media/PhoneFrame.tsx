import type { CSSProperties, ReactNode } from "react";
import { mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased, linear, smoothstep } from "../../motion/timeline";
import { type Rect, rectStyle } from "../accents/geometry";
import { useMs } from "../motion/Move";

type Props = { rect: Rect; atMs: number; tempo: Tempo; children: ReactNode };

const bezelShare = 0.035;
const radiusShare = 0.14;
const tiltFromDegrees = 28;
const riseFromShare = 0.12;
const tiltMoves = 3;
const bezelColor = "#0B0B0F";

// A phone swings in from a turn in perspective and settles flat, its screen showing whatever it holds.
export function PhoneFrame({ rect, atMs, tempo, children }: Props) {
  const ms = useMs();
  if (ms < atMs) return null;

  const settled = eased(ms, atMs, tempo.moveMs * tiltMoves, tempo.enterCurve);
  const shown = smoothstep(Math.min(1, linear(ms, atMs, tempo.moveMs) * 1.5));

  return (
    <div style={bodyStyle(rect, settled, shown)}>
      <div style={screenStyle(rect)}>
        {children}
        <Island rect={rect} />
      </div>
    </div>
  );
}

function bodyStyle(rect: Rect, settled: number, shown: number): CSSProperties {
  const rise = mix(riseFromShare, 0, settled) * rect.h;
  const turn = mix(tiltFromDegrees, 0, settled);

  return {
    ...rectStyle(rect),
    opacity: shown,
    transform: `perspective(${rect.w * 4}px) translateY(${rise}px) rotateY(${turn}deg)`,
    borderRadius: rect.w * radiusShare,
    backgroundColor: bezelColor,
    padding: rect.w * bezelShare,
    boxShadow: "0 30px 80px rgba(10,10,20,0.4)",
  };
}

function screenStyle(rect: Rect): CSSProperties {
  return {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: rect.w * (radiusShare - bezelShare),
    overflow: "hidden",
  };
}

function Island({ rect }: { rect: Rect }) {
  const bezel = rect.w * bezelShare;

  return (
    <div
      style={{
        position: "absolute",
        top: bezel,
        left: "50%",
        width: rect.w * 0.3,
        height: bezel * 2.2,
        transform: "translateX(-50%)",
        borderRadius: 999,
        backgroundColor: bezelColor,
      }}
    />
  );
}
