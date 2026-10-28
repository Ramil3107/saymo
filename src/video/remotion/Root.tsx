import { Composition } from "remotion";
import sampleDoc from "../../../fixtures/video.sample.json" with {
  type: "json",
};
import { formatSize } from "../destinations";
import { type VideoDoc, VideoDocSchema } from "../schema/video";
import { msToFrame } from "./frames";
import { SaymoVideo } from "./SaymoVideo";

export const Root = () => (
  <Composition
    id="saymo"
    component={SaymoVideo}
    defaultProps={VideoDocSchema.parse(sampleDoc)}
    calculateMetadata={({ props }: { props: VideoDoc }) => ({
      fps: props.fps,
      durationInFrames: msToFrame(props.durationMs, props.fps),
      ...formatSize(props.format),
    })}
  />
);
