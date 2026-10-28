import { expect, test } from "vitest";
import sampleDoc from "../../../fixtures/video.sample.json" with {
  type: "json",
};
import { VideoDocSchema } from "../schema/video";

test("the sample document is valid", () => {
  const doc = VideoDocSchema.parse(sampleDoc);
  expect(doc.durationMs).toBe(15000);
  expect(doc.captions?.pages).toHaveLength(3);
  expect(doc.scenes.map((s) => s.id)).toEqual(["b1", "b2", "b3"]);
});
