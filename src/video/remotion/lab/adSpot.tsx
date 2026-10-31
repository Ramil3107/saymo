import { fitText } from "@remotion/layout-utils";
import { Video } from "@remotion/media";
import type { ReactNode } from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { pagesFor } from "../../captions/looks";
import { destinations } from "../../destinations";
import { registers } from "../../registers";
import type { Transition } from "../../schema/video";
import type { TitleEntrance, TitleLine } from "../../type/schedule";
import { Burst } from "../accents/Burst";
import { Cursor } from "../accents/Cursor";
import { GrowFrame } from "../accents/GrowFrame";
import { type Rect, rectStyle } from "../accents/geometry";
import { Scribble } from "../accents/Scribble";
import { SelectionBox } from "../accents/SelectionBox";
import { Sparkles } from "../accents/Sparkles";
import { CaptionLayer } from "../captions/CaptionLayer";
import { msToFrame } from "../frames";
import { Collage } from "../media/Collage";
import { SceneTransition } from "../motion/SceneTransition";
import type { StyleKit } from "../style/kit";
import { Backdrop } from "../style/Textures";
import type { Theme } from "../theme";
import { CornerLabel } from "../type/CornerLabel";
import { Counter, countDurationMs } from "../type/Counter";
import { KineticTitle } from "../type/KineticTitle";
import type { CaptionLabProps } from "./captionLabProps";

export type SpotProps = { kit: StyleKit; lab: CaptionLabProps; width: number; height: number };

type Scene = { ms: number; body: (props: SpotProps) => ReactNode };

const scenes: Scene[] = [
  { ms: 2600, body: HookScene },
  { ms: 3000, body: CounterScene },
  { ms: 2800, body: CollageScene },
  { ms: 3500, body: FootageScene },
  { ms: 2500, body: CallScene },
];
const faces = ["face-1.jpg", "face-2.jpg", "face-3.jpg", "face-4.jpg", "face-5.jpg"].map((name) =>
  staticFile(name),
);
const atMs = 200;
const titleShare = 0.86;
const labelTypingMs = 1500;

export const spotMs = scenes.reduce((total, scene) => total + scene.ms, 0);

export function AdSpot(props: SpotProps) {
  const { kit, width } = props;
  const colors = { flash: "#FFFFFF", dip: kit.palette.ink, panel: kit.palette.ink, edge: kit.palette.accent };

  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.body.name}
          from={msToFrame(startOf(index))}
          durationInFrames={msToFrame(scene.ms)}
        >
          <SceneTransition
            into={index === 0 ? "cut" : transitionAt(kit, index - 1)}
            outof={index === scenes.length - 1 ? "cut" : transitionAt(kit, index)}
            durationMs={scene.ms}
            tempo={kit.tempo}
            width={width}
            colors={colors}
          >
            {scene.body(props)}
          </SceneTransition>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function HookScene(props: SpotProps) {
  const { kit, width, height } = props;
  const lines: TitleLine[] = [
    { text: upper(kit, "Безглютенова"), size: "l", tone: "ink", align: "left" },
    { text: upper(kit, "дієта?"), size: "xl", tone: "accent", align: "left" },
  ];

  return (
    <Stage kit={kit} width={width} height={height}>
      <KineticTitle
        {...kit}
        font={kit.display}
        lines={lines}
        entrance={entranceAt(kit, 0)}
        atMs={atMs}
        width={width * titleShare}
      />
      <HookAccent {...props} />
    </Stage>
  );
}

function HookAccent({ kit, width, height }: SpotProps) {
  if (kit.style.flourishes.includes("chevrons")) {
    return (
      <CornerLabel
        {...kit}
        font={kit.display}
        text="synevo · 01"
        corner="top-left"
        chevrons
        atMs={atMs}
        width={width}
      />
    );
  }

  const points = [
    { x: width * 0.85, y: height * 0.38 },
    { x: width * 0.12, y: height * 0.6 },
  ];
  return (
    <Sparkles
      points={points}
      atMs={900}
      size={width * 0.06}
      tempo={kit.tempo}
      color={kit.palette.highlight}
    />
  );
}

function CounterScene(props: SpotProps) {
  const { kit, width, height } = props;

  return (
    <Stage kit={kit} width={width} height={height}>
      <Counter
        {...kit}
        font={kit.display}
        from={0}
        to={3}
        suffix={upper(kit, " маркери")}
        label="в одному аналізі"
        ghost={kit.style.flourishes.includes("ghost-numbers")}
        atMs={atMs}
        width={width * titleShare}
      />
      <CounterAccent {...props} />
    </Stage>
  );
}

function CounterAccent({ kit, width, height }: SpotProps) {
  const landedMs = atMs + countDurationMs(kit.tempo);
  if (kit.style.accents.celebrate === "burst") {
    return (
      <Burst
        around={{ x: width * 0.75, y: height * 0.4 - width * 0.03, w: width * 0.06, h: width * 0.06 }}
        atMs={landedMs}
        tempo={kit.tempo}
        color={kit.palette.ink}
        widthPx={width * 0.0063}
      />
    );
  }

  const under = { x: width * 0.2, y: height * 0.555, w: width * 0.6, h: width * 0.04 };
  return (
    <Scribble
      kind="underline"
      around={under}
      atMs={landedMs + labelTypingMs}
      tempo={kit.tempo}
      color={kit.palette.accent}
      widthPx={width * 0.01}
    />
  );
}

function CollageScene(props: SpotProps) {
  const { kit, width, height } = props;
  const tag = tagRect(width, height);
  const area = { x: width * 0.06, y: height * 0.1, w: width * 0.88, h: height * 0.56 };
  const layout = kit.style.accents.frame === "grow-frame" ? "staircase" : "scatter";

  return (
    <Stage kit={kit} width={width} height={height}>
      <Collage srcs={faces} layout={layout} area={area} atMs={atMs} tempo={kit.tempo} />
      <Tag kit={kit} rect={tag} width={width} text={upper(kit, "Без направлення")} />
      <CollageAccent {...props} />
    </Stage>
  );
}

function CollageAccent({ kit, width, height }: SpotProps) {
  const tag = tagRect(width, height);
  if (kit.style.accents.frame === "grow-frame") {
    const from = { x: width / 2, y: tag.y + tag.h / 2, w: 2, h: 2 };
    return (
      <GrowFrame
        from={from}
        to={tag}
        atMs={900}
        holdMs={900}
        tempo={kit.tempo}
        color={kit.palette.accent}
        strokePx={4}
      />
    );
  }

  return (
    <SelectionBox
      rect={tag}
      atMs={900}
      tempo={kit.tempo}
      color={kit.palette.accent}
      handlePx={width * 0.022}
    />
  );
}

function FootageScene({ kit, lab, width, height }: SpotProps) {
  const style = kit.style.captions[0] ?? "rail";
  const captions = { style, keywords: lab.keywords, pages: pagesFor(style, lab.words) };

  return (
    <AbsoluteFill>
      <Video
        src={staticFile(lab.footage)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <CaptionLayer
        captions={captions}
        theme={captionTheme(kit, lab)}
        safeZone={destinations.reels.safeZone}
        frame={{ width, height }}
      />
    </AbsoluteFill>
  );
}

function CallScene({ kit, width, height }: SpotProps) {
  const lines: TitleLine[] = [
    { text: upper(kit, "Запишіться на"), size: "m", tone: "ink", align: "center" },
    { text: "synevo.ua", size: "l", tone: "accent", align: "center", marked: true },
  ];

  return (
    <Stage kit={kit} width={width} height={height}>
      <KineticTitle
        {...kit}
        font={kit.display}
        lines={lines}
        entrance={entranceAt(kit, 1)}
        atMs={atMs}
        width={width * titleShare}
      />
      {kit.style.flourishes.includes("cursor") ? (
        <Cursor
          from={{ x: width * 0.85, y: height * 0.85 }}
          to={{ x: width * 0.62, y: height * 0.53 }}
          atMs={1200}
          tempo={kit.tempo}
          color={kit.palette.accent}
          size={width * 0.07}
        />
      ) : null}
    </Stage>
  );
}

function Stage({
  kit,
  width,
  height,
  children,
}: {
  kit: StyleKit;
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <AbsoluteFill>
      <Backdrop kit={kit} width={width} height={height} />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", fontFamily: kit.display.family }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function startOf(index: number): number {
  return scenes.slice(0, index).reduce((total, scene) => total + scene.ms, 0);
}

function transitionAt(kit: StyleKit, index: number): Transition {
  const list = kit.style.transitions;
  return list[index % list.length] ?? "cut";
}

function entranceAt(kit: StyleKit, index: number): TitleEntrance {
  const list = kit.style.titleEntrances;
  return list[index % list.length] ?? "rise";
}

function upper(kit: StyleKit, text: string): string {
  return kit.style.display.upper ? text.toUpperCase() : text;
}

function captionTheme(kit: StyleKit, lab: CaptionLabProps): Theme {
  const register = registers[kit.tempo.flashMs > 0 ? "driving-launch" : "serious-clinical"];

  return {
    brand: { colors: lab.colors, font: "Onest" },
    register,
    tempo: kit.tempo,
    kit,
    fontFamily: kit.textFamily,
    safeZone: destinations.reels.safeZone,
  };
}

function tagRect(width: number, height: number): Rect {
  return { x: width * 0.16, y: height * 0.74, w: width * 0.68, h: width * 0.14 };
}

function Tag({ kit, rect, width, text }: { kit: StyleKit; rect: Rect; width: number; text: string }) {
  const fitted = fitText({
    text,
    withinWidth: rect.w * 0.88,
    fontFamily: kit.display.family,
    fontWeight: kit.display.weight,
  });

  return (
    <div
      style={{
        ...rectStyle(rect),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kit.palette.highlight,
        color: kit.palette.ink,
        fontFamily: kit.display.family,
        fontWeight: kit.display.weight,
        fontSize: Math.min(width * 0.06, fitted.fontSize),
        borderRadius: width * 0.02,
      }}
    >
      {text}
    </div>
  );
}
