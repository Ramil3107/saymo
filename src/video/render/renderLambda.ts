import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  type AwsRegion,
  getRenderProgress,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import { type Env, requireEnv } from "../../lib/env";
import type { Metrics } from "../../lib/metrics";
import type { VideoDoc } from "../schema/video";

const pollMs = 1000;
const assetUrlTtlSeconds = 2 * 60 * 60;

export function bucketFromServeUrl(serveUrl: string): string {
  const host = new URL(serveUrl).hostname;
  const match = host.match(/^(remotionlambda-[a-z0-9-]+)\.s3[.-]/);
  if (!match?.[1]) throw new Error(`${serveUrl} is not a Remotion S3 site URL`);
  return match[1];
}

const contentTypes: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  jpg: "image/jpeg",
  png: "image/png",
};

export async function uploadRunAssets(
  doc: VideoDoc,
  runId: string,
  env: Env,
): Promise<VideoDoc> {
  const region = env.AWS_REGION as AwsRegion;
  const bucket = bucketFromServeUrl(requireEnv(env, "REMOTION_SERVE_URL"));
  const s3 = new S3Client({ region });
  const assets = await Promise.all(
    doc.assets.map(async (asset) => {
      if (/^https?:\/\//.test(asset.src)) return asset;
      const key = `assets/${runId}/${basename(asset.src)}`;
      const extension = asset.src.split(".").at(-1) ?? "";
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: await readFile(asset.src),
          ContentType: contentTypes[extension],
        }),
      );
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: assetUrlTtlSeconds },
      );
      return { ...asset, src: url };
    }),
  );
  return { ...doc, assets };
}

export async function renderOnLambda(input: {
  doc: VideoDoc;
  outName: string;
  env: Env;
  metrics: Metrics;
}): Promise<{ url: string; ms: number; usd: number }> {
  const startedAt = performance.now();
  const region = input.env.AWS_REGION as AwsRegion;
  const functionName = requireEnv(input.env, "REMOTION_LAMBDA_FUNCTION_NAME");
  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl: requireEnv(input.env, "REMOTION_SERVE_URL"),
    composition: "saymo",
    inputProps: input.doc,
    codec: "h264",
    outName: input.outName,
    privacy: "public",
  });
  while (true) {
    await new Promise((done) => setTimeout(done, pollMs));
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region,
    });
    if (progress.fatalErrorEncountered) {
      throw new Error(
        `Lambda render failed: ${progress.errors.map((e) => e.message).join("; ")}`,
      );
    }
    if (progress.done && progress.outputFile) {
      const ms = Math.round(performance.now() - startedAt);
      const usd = progress.costs.accruedSoFar;
      input.metrics.record({
        step: "render",
        provider: "lambda",
        ms,
        usd,
        detail: { where: "lambda", renderId },
      });
      return { url: progress.outputFile, ms, usd };
    }
  }
}
