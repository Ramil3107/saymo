import { expect, test } from "vitest";
import { bucketFromServeUrl } from "./renderLambda";

test("bucketFromServeUrl reads the bucket name from a Remotion site URL", () => {
  expect(
    bucketFromServeUrl(
      "https://remotionlambda-useast1-abc123.s3.us-east-1.amazonaws.com/sites/saymo/index.html",
    ),
  ).toBe("remotionlambda-useast1-abc123");
});

test("bucketFromServeUrl rejects a URL that is not an S3 site", () => {
  expect(() =>
    bucketFromServeUrl("https://example.com/site/index.html"),
  ).toThrow("not a Remotion S3 site URL");
});
