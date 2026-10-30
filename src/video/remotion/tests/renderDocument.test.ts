import { expect, test } from "vitest";
import sampleDocJson from "../../../../fixtures/video.sample.json" with { type: "json" };
import { VideoDocSchema } from "../../schema/video";
import { documentForRender } from "../renderDocument";

const sampleDoc = VideoDocSchema.parse(sampleDocJson);

test("documentForRender takes the input document as is, without the sample's captions", () => {
  const { captions: _captions, ...withoutCaptions } = sampleDoc;
  const merged = { ...sampleDoc, ...withoutCaptions };

  expect(documentForRender(withoutCaptions, merged).captions).toBeUndefined();
});

test("documentForRender falls back to the merged props when no input was given", () => {
  expect(documentForRender({}, sampleDoc)).toBe(sampleDoc);
});
