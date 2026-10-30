import { type CalculateMetadataFunction, Composition, getInputProps } from "remotion";
import sampleDoc from "../../../fixtures/video.sample.json" with { type: "json" };
import { formatSize } from "../destinations";
import { type VideoDoc, VideoDocSchema } from "../schema/video";
import { fps, msToFrame } from "./frames";
import { labFrames, labSize } from "./lab/LabReel";
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
