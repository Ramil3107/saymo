import type {
  ContentMap,
  FaceBox,
  FrameNote,
  Shot,
} from "../../../video/schema/content";
import { ContentMapSchema } from "../../../video/schema/content";
import type { MediaInfo } from "../../../video/schema/media";
import type { Transcript } from "../../../video/schema/transcript";

export function buildContentMap(input: {
  source: string;
  info: MediaInfo;
  shots: Shot[];
  faces: FaceBox[];
  frames: FrameNote[];
  transcript: Transcript | null;
}): ContentMap {
  return ContentMapSchema.parse({
    source: { path: input.source, ...input.info },
    shots: input.shots,
    faces: input.faces,
    frames: input.frames,
    transcript: input.transcript,
  });
}
