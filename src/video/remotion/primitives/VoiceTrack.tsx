import { Audio, Sequence } from "remotion";
import type { VideoDoc } from "../../schema/video";
import { msToFrame } from "../frames";

type Voice = VideoDoc["voice"][number];

export function VoiceTrack({ voice, src }: { voice: Voice; src: string }) {
  return (
    <Sequence from={msToFrame(voice.atMs)}>
      <Audio src={src} />
    </Sequence>
  );
}
