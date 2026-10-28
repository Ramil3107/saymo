import { readFile } from "node:fs/promises";
import {
  DetectFacesCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import type { Metrics } from "../../../lib/metrics";
import { REKOGNITION_USD_PER_IMAGE } from "../../../lib/pricing";
import type { Box, FaceBox } from "../../../video/schema/content";

type Frame = { tMs: number; path: string };

export interface FaceDetector {
  detect(frame: Frame): Promise<FaceBox[]>;
}

type RekognitionBox = {
  Left?: number;
  Top?: number;
  Width?: number;
  Height?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

export function boxFromRekognition(box: RekognitionBox): Box {
  const x = clamp01(box.Left ?? 0);
  const y = clamp01(box.Top ?? 0);
  return {
    x,
    y,
    w: round6(clamp01((box.Left ?? 0) + (box.Width ?? 0)) - x),
    h: round6(clamp01((box.Top ?? 0) + (box.Height ?? 0)) - y),
  };
}

export function rekognitionDetector(region: string): FaceDetector {
  const client = new RekognitionClient({ region });
  return {
    async detect(frame) {
      const result = await client.send(
        new DetectFacesCommand({
          Image: { Bytes: await readFile(frame.path) },
          Attributes: ["DEFAULT"],
        }),
      );
      return (result.FaceDetails ?? [])
        .filter((face) => face.BoundingBox)
        .map((face) => ({
          tMs: frame.tMs,
          ...boxFromRekognition(face.BoundingBox as RekognitionBox),
        }));
    },
  };
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
    ms: Math.round(performance.now() - startedAt),
    usd: frames.length * REKOGNITION_USD_PER_IMAGE,
    detail: { frames: frames.length, faces: faces.length },
  });
  return faces;
}
