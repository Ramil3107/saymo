import { readFile } from "node:fs/promises";
import { DetectFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import { elapsedMs, type Metrics } from "../../../lib/metrics";
import { REKOGNITION_USD_PER_IMAGE } from "../../../lib/pricing";
import { clamp01, round6 } from "../../../video/layout/geometry";
import type { Box, FaceBox } from "../../../video/schema/content";

type Frame = { tMs: number; path: string };
type RekognitionBox = { Left?: number; Top?: number; Width?: number; Height?: number };

export interface FaceDetector {
  detect(frame: Frame): Promise<FaceBox[]>;
}

export async function detectFaces(
  detector: FaceDetector,
  frames: Frame[],
  metrics: Metrics,
): Promise<FaceBox[]> {
  const startedAt = performance.now();
  const faces: FaceBox[] = [];
  for (const frame of frames) faces.push(...(await detector.detect(frame)));

  metrics.record({
    step: "see",
    provider: "rekognition",
    ms: elapsedMs(startedAt),
    usd: frames.length * REKOGNITION_USD_PER_IMAGE,
    detail: { frames: frames.length, faces: faces.length },
  });

  return faces;
}

export function rekognitionDetector(region: string): FaceDetector {
  const client = new RekognitionClient({ region });

  return {
    async detect(frame) {
      const command = new DetectFacesCommand({
        Image: { Bytes: await readFile(frame.path) },
        Attributes: ["DEFAULT"],
      });
      const result = await client.send(command);

      return (result.FaceDetails ?? []).flatMap((face) =>
        face.BoundingBox ? [{ tMs: frame.tMs, ...boxFromRekognition(face.BoundingBox) }] : [],
      );
    },
  };
}

export function boxFromRekognition(box: RekognitionBox): Box {
  const left = box.Left ?? 0;
  const top = box.Top ?? 0;
  const x = clamp01(left);
  const y = clamp01(top);

  return {
    x,
    y,
    w: round6(clamp01(left + (box.Width ?? 0)) - x),
    h: round6(clamp01(top + (box.Height ?? 0)) - y),
  };
}
