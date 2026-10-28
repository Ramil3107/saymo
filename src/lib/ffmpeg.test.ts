import { expect, test } from "vitest";
import { probe } from "./ffmpeg";

test("probe rejects a non-video file", async () => {
  await expect(probe("package.json")).rejects.toThrow("Not a video file");
});
