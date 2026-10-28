import { Audio } from "remotion";
import { musicVolumeAt } from "../../audio/ducking";
import type { VideoDoc } from "../../schema/video";
import { frameToMs } from "../frames";

type Music = NonNullable<VideoDoc["music"]>;

export function MusicTrack({ music, src }: { music: Music; src: string }) {
  const volumeAt = (frame: number) =>
    musicVolumeAt(frameToMs(frame), music.speech, music.volume, music.duckTo);

  return <Audio src={src} loop volume={volumeAt} />;
}
