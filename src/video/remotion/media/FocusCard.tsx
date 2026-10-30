import type { CSSProperties } from "react";
import { Img } from "remotion";
import { mix } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { eased } from "../../motion/timeline";
import type { Box } from "../../schema/content";
import { type Rect, rectStyle } from "../accents/geometry";
import { useMs } from "../motion/Move";

type Props = {
  src: string;
  aspect: number;
  rect: Rect;
  focus: Box;
  atMs: number;
  holdMs: number;
  tempo: Tempo;
  accent: string;
};

const zoomMoves = 3;
const focusFill = 0.86;
const dimAlpha = 0.5;

// motionvid: the camera moves into one detail of a card, the rest of the card dims, then the camera pulls back.
export function FocusCard({ src, aspect, rect, focus, atMs, holdMs, tempo, accent }: Props) {
  const ms = useMs();
  const zoomMs = tempo.moveMs * zoomMoves;
  const zoomed =
    eased(ms, atMs, zoomMs, tempo.moveCurve) - eased(ms, atMs + zoomMs + holdMs, zoomMs, tempo.moveCurve);
  const page = cameraOn(rect, aspect, focus, zoomed);

  return (
    <div style={cardStyle(rect)}>
      <div style={{ position: "absolute", left: page.x, top: page.y, width: page.w, height: page.h }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={spotlight(focus, zoomed, accent)} />
      </div>
    </div>
  );
}

function cameraOn(rect: Rect, aspect: number, focus: Box, zoomed: number): Rect {
  const scale = mix(1, focusFill / focus.w, zoomed);
  const w = rect.w * scale;
  const h = (rect.w / aspect) * scale;

  return {
    x: mix(0, rect.w / 2 - (focus.x + focus.w / 2) * w, zoomed),
    y: mix(0, rect.h / 2 - (focus.y + focus.h / 2) * h, zoomed),
    w,
    h,
  };
}

function cardStyle(rect: Rect): CSSProperties {
  return {
    ...rectStyle(rect),
    overflow: "hidden",
    borderRadius: rect.w * 0.04,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 30px 80px rgba(10,10,20,0.3)",
  };
}

function spotlight(focus: Box, zoomed: number, accent: string): CSSProperties {
  return {
    position: "absolute",
    left: `${focus.x * 100}%`,
    top: `${focus.y * 100}%`,
    width: `${focus.w * 100}%`,
    height: `${focus.h * 100}%`,
    borderRadius: 6,
    outline: `${3 * zoomed}px solid ${accent}`,
    boxShadow: `0 0 0 9999px rgba(10, 10, 20, ${dimAlpha * zoomed})`,
  };
}
