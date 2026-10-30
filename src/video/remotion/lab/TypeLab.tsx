import { type Demo, LabReel } from "./LabReel";
import {
  CounterDemo,
  HierarchyDemo,
  HookDemo,
  HudDemo,
  MarkerDemo,
  PopWordsDemo,
  SwapDemo,
  TrackingDemo,
} from "./typeDemos";

const demoMs = 3500;

export const typeDemos: Demo[] = [
  { title: "Hook, typed letter by letter", component: HookDemo, durationMs: demoMs },
  { title: "Size and alignment hierarchy, words rise", component: HierarchyDemo, durationMs: demoMs },
  { title: "Tracking in", component: TrackingDemo, durationMs: demoMs },
  { title: "Words pop one by one", component: PopWordsDemo, durationMs: demoMs },
  { title: "Reveal, then a marker", component: MarkerDemo, durationMs: demoMs },
  { title: "Punch in, color swap, tilt out", component: SwapDemo, durationMs: demoMs },
  { title: "Counter with a unit, a label and a ghost", component: CounterDemo, durationMs: demoMs },
  { title: "Corner labels and a price count", component: HudDemo, durationMs: demoMs },
];

export function TypeLab() {
  return <LabReel demos={typeDemos} />;
}
