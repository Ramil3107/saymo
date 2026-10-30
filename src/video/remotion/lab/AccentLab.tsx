import {
  ArrowBadgeDemo,
  BurstSparklesDemo,
  CursorClickDemo,
  FlashDemo,
  FrameGrowDemo,
  PortraitHudDemo,
  ScribbleDemo,
  SelectionTagDemo,
  TexturesDemo,
} from "./accentDemos";
import { type Demo, LabReel } from "./LabReel";

const demoMs = 3500;

export const accentDemos: Demo[] = [
  { title: "A frame grows to the edges, the shot flashes", component: FrameGrowDemo, durationMs: demoMs },
  { title: "Color blocks flash over a collage", component: FlashDemo, durationMs: demoMs },
  { title: "Burst and sparkles", component: BurstSparklesDemo, durationMs: demoMs },
  { title: "Badge, typed label, drawn arrow", component: ArrowBadgeDemo, durationMs: demoMs },
  { title: "A tag with a selection box", component: SelectionTagDemo, durationMs: demoMs },
  { title: "Hand-drawn circle and underline", component: ScribbleDemo, durationMs: demoMs },
  { title: "A cursor clicks a button", component: CursorClickDemo, durationMs: demoMs },
  { title: "Textures: grain, paper grid, halftone, blobs", component: TexturesDemo, durationMs: demoMs },
  { title: "Duotone, halftone and viewfinder brackets", component: PortraitHudDemo, durationMs: demoMs },
];

export function AccentLab() {
  return <LabReel demos={accentDemos} />;
}
