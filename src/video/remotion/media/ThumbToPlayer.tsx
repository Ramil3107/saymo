import { Video } from "@remotion/media";
import type { CSSProperties } from "react";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import { Chevrons } from "../accents/Chevrons";
import { mixRect, type Rect, rectStyle } from "../accents/geometry";
import { useMs } from "../motion/Move";

type Props = { src: string; thumb: Rect; player: Rect; atMs: number; tempo: Tempo; accent: string };

const growMoves = 2.5;
const thickBorder = 10;
const thinBorder = 3;
const barShare = 0.012;
const progressSpanMs = 6000;

// Higgsfield: a tile in the collage grows into a player, and the player chrome appears once it lands.
export function ThumbToPlayer({ src, thumb, player, atMs, tempo, accent }: Props) {
  const ms = useMs();
  const growMs = tempo.moveMs * growMoves;
  const grown = eased(ms, atMs, growMs, tempo.moveCurve);
  const rect = mixRect(thumb, player, grown);
  const landed = ms >= atMs + growMs;

  return (
    <div
      style={{
        ...rectStyle(rect),
        overflow: "hidden",
        border: `${grown < 1 ? thickBorder : thinBorder}px solid ${accent}`,
      }}
    >
      <Video
        src={src}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {landed ? <Chrome ms={ms - atMs - growMs} width={rect.w} tempo={tempo} accent={accent} /> : null}
    </div>
  );
}

function Chrome({ ms, width, tempo, accent }: { ms: number; width: number; tempo: Tempo; accent: string }) {
  const seconds = Math.floor(ms / 1000);
  const label = labelStyle(width);

  return (
    <>
      <div style={{ position: "absolute", right: width * 0.05, top: width * 0.05 }}>
        <Chevrons tempo={tempo} color={accent} size={width * 0.08} pointing="right" />
      </div>
      <div style={controlsStyle(width)}>
        <span style={label}>▶</span>
        <Progress ms={ms} width={width} accent={accent} />
        <span style={label}>{`00:${String(seconds).padStart(2, "0")}`}</span>
      </div>
    </>
  );
}

function Progress({ ms, width, accent }: { ms: number; width: number; accent: string }) {
  const played = Math.min(100, (ms / progressSpanMs) * 100);

  return (
    <div style={{ flex: 1, height: width * barShare, backgroundColor: "rgba(255,255,255,0.35)" }}>
      <div style={{ width: `${played}%`, height: "100%", backgroundColor: accent }} />
    </div>
  );
}

function controlsStyle(width: number): CSSProperties {
  return {
    position: "absolute",
    left: width * 0.05,
    right: width * 0.05,
    bottom: width * 0.05,
    display: "flex",
    alignItems: "center",
    gap: width * 0.03,
  };
}

function labelStyle(width: number): CSSProperties {
  return {
    fontSize: width * 0.045,
    fontWeight: 800,
    color: "#FFFFFF",
    textShadow: "0 1px 6px rgba(0,0,0,0.6)",
  };
}
