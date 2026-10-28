import { Audio, Sequence } from "remotion";
import type { VideoDoc } from "../../schema/video";
import { msToFrame } from "../frames";

export function VoiceTrack({
  voice,
  src,
}: {
  voice: VideoDoc["voice"][number];
  src: string;
}) {
  return (
    <Sequence from={msToFrame(voice.atMs)}>
      <Audio src={src} />
    </Sequence>
  );
}
