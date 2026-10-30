import { type Demo, LabReel } from "./LabReel";
import { CollageGrowDemo } from "./mediaDemos";
import { FlipCardsDemo, MorphBurstDemo, PopChipsDemo, SmearChevronsDemo } from "./shapeDemos";
import { PunchCountDemo, RevealSwapDemo, RiseDemo, SplitDemo, TypeOnDemo } from "./textDemos";

const demoMs = 3000;
const longDemoMs = 4500;

export const motionDemos: Demo[] = [
  { title: "Type on, letter by letter", component: TypeOnDemo, durationMs: demoMs },
  { title: "Words rise from a mask", component: RiseDemo, durationMs: demoMs },
  { title: "Punch in and count", component: PunchCountDemo, durationMs: demoMs },
  { title: "Pop with stagger, float, collapse", component: PopChipsDemo, durationMs: longDemoMs },
  { title: "Smear in and out, chevrons", component: SmearChevronsDemo, durationMs: demoMs },
  { title: "Reveal, color swap, tilt out", component: RevealSwapDemo, durationMs: demoMs },
  { title: "Morph a box into a name, burst", component: MorphBurstDemo, durationMs: demoMs },
  { title: "Split to frame the subject", component: SplitDemo, durationMs: demoMs },
  { title: "Flip state one by one", component: FlipCardsDemo, durationMs: demoMs },
  { title: "Collage, grow into the frame, tilt out", component: CollageGrowDemo, durationMs: demoMs },
];

export function MotionLab() {
  return <LabReel demos={motionDemos} />;
}
