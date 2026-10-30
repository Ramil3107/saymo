import { type VideoDoc, VideoDocSchema } from "../schema/video";

// Remotion merges input props over the default props, so a document without captions would inherit the sample's.
export function documentForRender(input: unknown, merged: VideoDoc): VideoDoc {
  if (!isNonEmptyObject(input)) return merged;

  return VideoDocSchema.parse(input);
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}
