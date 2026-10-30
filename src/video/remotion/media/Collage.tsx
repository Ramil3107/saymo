import type { CSSProperties } from "react";
import { Img } from "remotion";
import { poseAt } from "../../motion/moves";
import type { Tempo } from "../../motion/tempo";
import { staggered } from "../../motion/timeline";
import { type Rect, rectStyle } from "../accents/geometry";
import { useMs } from "../motion/Move";
import { restingTransform } from "../motion/pixels";

export type CollageLayout = "staircase" | "scatter";

type Props = { srcs: string[]; layout: CollageLayout; area: Rect; atMs: number; tempo: Tempo };
type Tile = { rect: Rect; rotate: number };

const tileWidthShare = 0.46;
const tileAspect = 0.66;
const scatterTurns = [-6, 4, -3, 7, -5, 3];

// Higgsfield: photos land one per frame along a diagonal or scattered at small angles.
export function Collage({ srcs, layout, area, atMs, tempo }: Props) {
  const ms = useMs();

  return (
    <>
      {srcs.map((src, index) => {
        const pose = poseAt(ms, { enter: "pop", atMs: staggered(atMs, index, tempo.staggerMs) }, tempo);
        if (!pose) return null;
        const tile = tileOf(layout, index, srcs.length, area);
        return <Img key={src} src={src} style={tileStyle(tile, pose.opacity, pose.scale)} />;
      })}
    </>
  );
}

export function tileOf(layout: CollageLayout, index: number, count: number, area: Rect): Tile {
  const w = area.w * tileWidthShare;
  const h = w * tileAspect;
  const step = count > 1 ? index / (count - 1) : 0;

  switch (layout) {
    case "staircase":
      return {
        rect: { x: area.x + step * (area.w - w), y: area.y + (1 - step) * (area.h - h), w, h },
        rotate: 0,
      };
    case "scatter": {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const rows = Math.ceil(count / 2);
      const y = area.y + (rows > 1 ? (row / (rows - 1)) * (area.h - h) : 0);
      return {
        rect: { x: area.x + column * (area.w - w), y, w, h },
        rotate: scatterTurns[index % scatterTurns.length] ?? 0,
      };
    }
  }
}

function tileStyle({ rect, rotate }: Tile, opacity: number, scale: number): CSSProperties {
  return {
    ...rectStyle(rect),
    objectFit: "cover",
    opacity,
    transform: restingTransform(`rotate(${rotate}deg) scale(${scale})`, rotate === 0 && scale === 1),
    boxShadow: "0 10px 30px rgba(10,10,20,0.28)",
    border: "3px solid #FFFFFF",
  };
}
