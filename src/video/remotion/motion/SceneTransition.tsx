import { type CSSProperties, type ReactNode, useId } from "react";
import { AbsoluteFill } from "remotion";
import type { Tempo } from "../../motion/tempo";
import { type TransitionLook, transitionLook, transitionPhase } from "../../motion/transitions";
import type { Transition } from "../../schema/video";
import { PixelateFilter, SmearFilter } from "./filters";
import { useMs } from "./Move";
import { restingTransform } from "./pixels";

export type TransitionColors = { flash: string; dip: string; panel: string; edge: string };

type Props = {
  into: Transition;
  outof: Transition;
  durationMs: number;
  tempo: Tempo;
  width: number;
  colors: TransitionColors;
  children: ReactNode;
};

type Filters = { smearId: string; smearPx: number; pixelId: string; blockPx: number };

const maxSmearShare = 0.06;
const minSmearPx = 0.5;
const maxBlurShare = 0.012;
const minBlurPx = 0.3;
const maxBlockShare = 0.06;
const minBlockPx = 2;
const edgeShare = 0.012;

// A scene enters by the transition into it and leaves by the transition into the next scene, each over half its length.
export function SceneTransition({ into, outof, durationMs, tempo, width, colors, children }: Props) {
  const ms = useMs();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const phase = transitionPhase(ms, durationMs, { into, outof }, tempo);
  if (!phase) return <AbsoluteFill>{children}</AbsoluteFill>;

  const look = transitionLook(phase, tempo);
  const filters = filtersFor(look, width, id);

  return (
    <AbsoluteFill>
      {filters.smearId ? <SmearFilter id={filters.smearId} px={filters.smearPx} /> : null}
      {filters.pixelId ? <PixelateFilter id={filters.pixelId} blockPx={filters.blockPx} /> : null}
      <AbsoluteFill style={layerStyle(look, width, filters)}>{children}</AbsoluteFill>
      {look.cover > 0 ? (
        <Cover color={phase.kind === "flash" ? colors.flash : colors.dip} opacity={look.cover} />
      ) : null}
      {look.panel ? <Panel panel={look.panel} width={width} colors={colors} /> : null}
    </AbsoluteFill>
  );
}

function filtersFor(look: TransitionLook, width: number, id: string): Filters {
  const smearPx = look.smear * width * maxSmearShare;
  const blockPx = look.pixel * width * maxBlockShare;

  return {
    smearId: smearPx > minSmearPx ? `smear${id}` : "",
    smearPx,
    pixelId: blockPx >= minBlockPx ? `pixel${id}` : "",
    blockPx,
  };
}

function layerStyle(look: TransitionLook, width: number, filters: Filters): CSSProperties {
  const blurPx = look.blur * width * maxBlurShare;
  const chain = [
    blurPx > minBlurPx ? `blur(${blurPx}px)` : "",
    filters.smearId ? `url(#${filters.smearId})` : "",
    filters.pixelId ? `url(#${filters.pixelId})` : "",
  ].filter((part) => part !== "");

  return {
    transform: restingTransform(
      `translateX(${look.x * 100}%) scale(${look.scale})`,
      look.x === 0 && look.scale === 1,
    ),
    filter: chain.length > 0 ? chain.join(" ") : undefined,
  };
}

function Cover({ color, opacity }: { color: string; opacity: number }) {
  return <AbsoluteFill style={{ backgroundColor: color, opacity }} />;
}

// The panel grows from the left edge before the cut and leaves past the right edge after it; the accent rides its moving side.
function Panel({
  panel,
  width,
  colors,
}: {
  panel: { left: number; right: number };
  width: number;
  colors: TransitionColors;
}) {
  const movingEdge = panel.left === 0 ? panel.right : panel.left;
  const edge = width * edgeShare;

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundColor: colors.panel,
          clipPath: `inset(0 ${(1 - panel.right) * 100}% 0 ${panel.left * 100}%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: Math.round(movingEdge * width - edge / 2),
          width: Math.round(edge),
          backgroundColor: colors.edge,
        }}
      />
    </>
  );
}
