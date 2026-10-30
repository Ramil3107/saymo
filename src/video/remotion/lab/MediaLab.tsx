import { type Demo, LabReel } from "./LabReel";
import {
  FlickerScatterDemo,
  FlipRevealDemo,
  FocusDocumentDemo,
  NamedGridDemo,
  PhoneDemo,
  StaircaseDemo,
  ThumbPlayerDemo,
} from "./mediaLabDemos";

export const mediaDemos: Demo[] = [
  { title: "Photos land on a staircase", component: StaircaseDemo, durationMs: 3500 },
  { title: "A burst of shots, then a scatter", component: FlickerScatterDemo, durationMs: 4000 },
  { title: "A tile grows into a player", component: ThumbPlayerDemo, durationMs: 4000 },
  { title: "A phone swings in", component: PhoneDemo, durationMs: 3500 },
  { title: "The grid lights the cell being named", component: NamedGridDemo, durationMs: 4000 },
  { title: "The camera moves into a detail", component: FocusDocumentDemo, durationMs: 5000 },
  { title: "Photos flip into facts", component: FlipRevealDemo, durationMs: 3500 },
];

export function MediaLab() {
  return <LabReel demos={mediaDemos} />;
}
