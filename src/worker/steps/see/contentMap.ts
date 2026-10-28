import {
  type ContentMap,
  ContentMapSchema,
  type FaceBox,
  type FrameNote,
  type Shot,
} from "../../../video/schema/content";
import type { MediaInfo } from "../../../video/schema/media";
import type { Transcript } from "../../../video/schema/transcript";

type ContentInput = {
  source: string;
  info: MediaInfo;
  shots: Shot[];
  faces: FaceBox[];
  frames: FrameNote[];
  transcript: Transcript | null;
};

export function buildContentMap(input: ContentInput): ContentMap {
  return ContentMapSchema.parse({
    source: { path: input.source, ...input.info },
    shots: input.shots,
    faces: input.faces,
    frames: input.frames,
    transcript: input.transcript,
  });
}
