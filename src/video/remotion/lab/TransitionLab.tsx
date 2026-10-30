import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import type { Transition } from "../../schema/video";
import { msToFrame } from "../frames";
import { SceneTransition } from "../motion/SceneTransition";
import { type Demo, LabReel } from "./LabReel";
import type { DemoProps } from "./looks";

type Shot = { src: string; title: string; position: string };

const demoMs = 2600;
const cutMs = 1300;
const before: Shot = { src: "face-1.jpg", title: "BEFORE", position: "50% 30%" };
const after: Shot = { src: "document.jpg", title: "AFTER", position: "50% 20%" };

export const transitionDemos: Demo[] = [
  { title: "Cut, for reference", component: CutDemo, durationMs: demoMs },
  { title: "Flash", component: FlashDemo, durationMs: demoMs },
  { title: "Wipe", component: WipeDemo, durationMs: demoMs },
  { title: "Whip", component: WhipDemo, durationMs: demoMs },
  { title: "Zoom", component: ZoomDemo, durationMs: demoMs },
  { title: "Pixelate", component: PixelateDemo, durationMs: demoMs },
  { title: "Dip", component: DipDemo, durationMs: demoMs },
];

export function TransitionLab() {
  return <LabReel demos={transitionDemos} />;
}

function CutDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="cut" />;
}

function FlashDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="flash" />;
}

function WipeDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="wipe" />;
}

function WhipDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="whip" />;
}

function ZoomDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="zoom" />;
}

function PixelateDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="pixelate" />;
}

function DipDemo(props: DemoProps) {
  return <TransitionDemo {...props} kind="dip" />;
}

function TransitionDemo({ look, width, kind }: DemoProps & { kind: Transition }) {
  const colors = {
    flash: "#FFFFFF",
    dip: look.palette.ink,
    panel: look.palette.ink,
    edge: look.palette.accent,
  };
  const scene = { tempo: look.tempo, width, colors };

  return (
    <AbsoluteFill>
      <Sequence durationInFrames={msToFrame(cutMs)}>
        <SceneTransition {...scene} into="cut" outof={kind} durationMs={cutMs}>
          <ShotView shot={before} width={width} />
        </SceneTransition>
      </Sequence>
      <Sequence from={msToFrame(cutMs)}>
        <SceneTransition {...scene} into={kind} outof="cut" durationMs={demoMs - cutMs}>
          <ShotView shot={after} width={width} />
        </SceneTransition>
      </Sequence>
    </AbsoluteFill>
  );
}

function ShotView({ shot, width }: { shot: Shot; width: number }) {
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(shot.src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: shot.position }}
      />
      <div
        style={{
          position: "absolute",
          bottom: width * 0.12,
          width: "100%",
          textAlign: "center",
          fontSize: width * 0.13,
          fontWeight: 900,
          color: "#FFFFFF",
          textShadow: "0 4px 24px rgba(0,0,0,0.55)",
        }}
      >
        {shot.title}
      </div>
    </AbsoluteFill>
  );
}
