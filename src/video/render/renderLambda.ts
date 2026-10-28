import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type AwsRegion, getRenderProgress, renderMediaOnLambda } from "@remotion/lambda/client";
import { type Env, requireEnv } from "../../lib/env";
import { elapsedMs, type Metrics } from "../../lib/metrics";
import type { VideoDoc } from "../schema/video";

type Asset = VideoDoc["assets"][number];
type RenderHandle = { renderId: string; bucketName: string; functionName: string; region: AwsRegion };
type FinishedRender = { outputFile: string; usd: number };
type LambdaResult = { url: string; ms: number; usd: number };

const compositionId = "saymo";
const pollMs = 1000;
const assetUrlTtlSeconds = 2 * 60 * 60;

const contentTypes: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  jpg: "image/jpeg",
  png: "image/png",
};

export async function renderOnLambda(input: {
  doc: VideoDoc;
  outName: string;
  env: Env;
  metrics: Metrics;
}): Promise<LambdaResult> {
  const startedAt = performance.now();
  const region = regionOf(input.env);
  const functionName = requireEnv(input.env, "REMOTION_LAMBDA_FUNCTION_NAME");

  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl: requireEnv(input.env, "REMOTION_SERVE_URL"),
    composition: compositionId,
    inputProps: input.doc,
    codec: "h264",
    outName: input.outName,
    privacy: "public",
  });
  const finished = await waitForRender({ renderId, bucketName, functionName, region });

  const ms = elapsedMs(startedAt);
  input.metrics.record({
    step: "render",
    provider: "lambda",
    ms,
    usd: finished.usd,
    detail: { where: "lambda", renderId },
  });

  return { url: finished.outputFile, ms, usd: finished.usd };
}

export async function uploadRunAssets(doc: VideoDoc, runId: string, env: Env): Promise<VideoDoc> {
  const region = regionOf(env);
  const bucket = bucketFromServeUrl(requireEnv(env, "REMOTION_SERVE_URL"));
  const s3 = new S3Client({ region });

  const assets = await Promise.all(
    doc.assets.map((asset) => (isRemote(asset.src) ? asset : uploadAsset(s3, bucket, runId, asset))),
  );

  return { ...doc, assets };
}

export function bucketFromServeUrl(serveUrl: string): string {
  const host = new URL(serveUrl).hostname;
  const match = host.match(/^(remotionlambda-[a-z0-9-]+)\.s3[.-]/);
  if (!match?.[1]) throw new Error(`${serveUrl} is not a Remotion S3 site URL`);

  return match[1];
}

async function waitForRender(render: RenderHandle): Promise<FinishedRender> {
  while (true) {
    await sleep(pollMs);
    const progress = await getRenderProgress(render);

    if (progress.fatalErrorEncountered) {
      const reasons = progress.errors.map((error) => error.message).join("; ");
      throw new Error(`Lambda render failed: ${reasons}`);
    }
    if (progress.done && progress.outputFile) {
      return { outputFile: progress.outputFile, usd: progress.costs.accruedSoFar };
    }
  }
}

async function uploadAsset(s3: S3Client, bucket: string, runId: string, asset: Asset): Promise<Asset> {
  const key = `assets/${runId}/${basename(asset.src)}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: await readFile(asset.src),
      ContentType: contentTypeOf(asset.src),
    }),
  );
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: assetUrlTtlSeconds,
  });

  return { ...asset, src: url };
}

function regionOf(env: Env): AwsRegion {
  return env.AWS_REGION as AwsRegion;
}

function isRemote(src: string): boolean {
  return /^https?:\/\//.test(src);
}

function contentTypeOf(path: string): string | undefined {
  const extension = path.split(".").at(-1) ?? "";
  return contentTypes[extension];
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}
