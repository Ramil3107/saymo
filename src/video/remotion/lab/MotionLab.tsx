import type { ComponentType } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { msToFrame } from "../frames";
import { type DemoProps, glideLook, type Look, snapLook } from "./looks";
import { CollageGrowDemo } from "./mediaDemos";
import { FlipCardsDemo, MorphBurstDemo, PopChipsDemo, SmearChevronsDemo } from "./shapeDemos";
import { PunchCountDemo, RevealSwapDemo, RiseDemo, SplitDemo, TypeOnDemo } from "./textDemos";

type Demo = { title: string; component: ComponentType<DemoProps> };

const demoMs = 3000;
const panel = { width: 540, height: 960, top: 92, gap: 80 };
const labWidth = 1920;
const labHeight = 1080;
const labBackground = "#101014";

const demos: Demo[] = [
  { title: "Type on, letter by letter", component: TypeOnDemo },
  { title: "Words rise from a mask", component: RiseDemo },
  { title: "Punch in and count", component: PunchCountDemo },
  { title: "Pop with stagger, drift, collapse", component: PopChipsDemo },
  { title: "Smear in and out, chevrons", component: SmearChevronsDemo },
  { title: "Reveal, color swap, tilt out", component: RevealSwapDemo },
  { title: "Morph a box into a name, burst", component: MorphBurstDemo },
  { title: "Split to frame the subject", component: SplitDemo },
  { title: "Flip state one by one", component: FlipCardsDemo },
  { title: "Collage, grow into the frame, tilt out", component: CollageGrowDemo },
];

export const motionLabSize = { width: labWidth, height: labHeight };

export const motionLabFrames = msToFrame(demoMs * demos.length);

export function MotionLab() {
  const demoFrames = msToFrame(demoMs);

  return (
    <AbsoluteFill style={{ backgroundColor: labBackground }}>
      {demos.map((demo, index) => (
        <Sequence key={demo.title} from={index * demoFrames} durationInFrames={demoFrames}>
          <Header title={`${index + 1} · ${demo.title}`} />
          <Panel look={snapLook} left={labWidth / 2 - panel.gap / 2 - panel.width} demo={demo} />
          <Panel look={glideLook} left={labWidth / 2 + panel.gap / 2} demo={demo} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div style={{ position: "absolute", top: 26, width: "100%", textAlign: "center", ...labText(30, 0.92) }}>
      {title}
    </div>
  );
}

function Panel({ look, left, demo }: { look: Look; left: number; demo: Demo }) {
  const Component = demo.component;

  return (
    <>
      <div style={{ position: "absolute", left, top: panel.top - 30, ...labText(18, 0.6) }}>{look.name}</div>
      <div
        style={{
          ...look.backdrop,
          position: "absolute",
          left,
          top: panel.top,
          width: panel.width,
          height: panel.height,
          borderRadius: 20,
          overflow: "hidden",
          fontFamily: look.fontFamily,
        }}
      >
        <Component look={look} width={panel.width} height={panel.height} />
      </div>
    </>
  );
}

function labText(fontSize: number, opacity: number) {
  return { fontFamily: "Helvetica, Arial, sans-serif", fontSize, fontWeight: 600, color: "white", opacity };
}
