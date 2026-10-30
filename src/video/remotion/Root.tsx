import { type CalculateMetadataFunction, Composition, getInputProps } from "remotion";
import sampleDoc from "../../../fixtures/video.sample.json" with { type: "json" };
import { formatSize } from "../destinations";
import { type VideoDoc, VideoDocSchema } from "../schema/video";
import { fps, msToFrame } from "./frames";
import { AccentLab, accentDemos } from "./lab/AccentLab";
import { CaptionLab, captionLabMetadata } from "./lab/CaptionLab";
import { captionLabDefaults } from "./lab/captionLabProps";
import { labFrames, labSize } from "./lab/LabReel";
import { MediaLab, mediaDemos } from "./lab/MediaLab";
import { MotionLab, motionDemos } from "./lab/MotionLab";
import { TypeLab, typeDemos } from "./lab/TypeLab";
import { documentForRender } from "./renderDocument";
import { SaymoVideo } from "./SaymoVideo";

export function Root() {
  return (
    <>
      <Composition
        id="saymo"
        component={SaymoVideo}
        defaultProps={VideoDocSchema.parse(sampleDoc)}
        calculateMetadata={metadataFor}
      />
      <Composition
        id="motion-lab"
        component={MotionLab}
        fps={fps}
        durationInFrames={labFrames(motionDemos)}
        {...labSize}
      />
      <Composition
        id="accent-lab"
        component={AccentLab}
        fps={fps}
        durationInFrames={labFrames(accentDemos)}
        {...labSize}
      />
      <Composition
        id="media-lab"
        component={MediaLab}
        fps={fps}
        durationInFrames={labFrames(mediaDemos)}
        {...labSize}
      />
      <Composition
        id="caption-lab"
        component={CaptionLab}
        defaultProps={captionLabDefaults}
        calculateMetadata={captionLabMetadata}
        fps={fps}
        durationInFrames={1}
        {...labSize}
      />
      <Composition
        id="type-lab"
        component={TypeLab}
        fps={fps}
        durationInFrames={labFrames(typeDemos)}
        {...labSize}
      />
    </>
  );
}

const metadataFor: CalculateMetadataFunction<VideoDoc> = ({ props }) => {
  const doc = documentForRender(getInputProps(), props);

  return {
    props: doc,
    fps: doc.fps,
    durationInFrames: msToFrame(doc.durationMs, doc.fps),
    ...formatSize(doc.format),
  };
};
