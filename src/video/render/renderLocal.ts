import { lstat, mkdir, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { elapsedMs } from "../../lib/metrics";
import { msToFrame } from "../remotion/frames";
import type { Scene, VideoDoc } from "../schema/video";

const compositionId = "saymo";
const entryPoint = resolve("src/video/remotion/index.ts");
const bundleDir = resolve(".remotion/bundle");
const runsDir = resolve("runs");

let bundling: Promise<string> | undefined;

export function bundleOnce(): Promise<string> {
  bundling ??= bundle({ entryPoint, outDir: bundleDir }).then(linkRunsIntoBundle);
  return bundling;
}

export async function renderLocal(doc: VideoDoc, outPath: string): Promise<{ ms: number }> {
  const startedAt = performance.now();
  const serveUrl = await bundleOnce();
  await mkdir(dirname(outPath), { recursive: true });

  await renderMedia({
    composition: await selectSaymo(serveUrl, doc),
    serveUrl,
    codec: "h264",
    outputLocation: outPath,
    inputProps: doc,
  });

  return { ms: elapsedMs(startedAt) };
}

export async function renderPoster(doc: VideoDoc, outPath: string, atMs: number): Promise<void> {
  const serveUrl = await bundleOnce();
  await mkdir(dirname(outPath), { recursive: true });

  await renderStill({
    composition: await selectSaymo(serveUrl, doc),
    serveUrl,
    output: outPath,
    frame: msToFrame(atMs, doc.fps),
    imageFormat: "jpeg",
    inputProps: doc,
  });
}

export function posterTimeMs(doc: VideoDoc): number {
  const scene = doc.scenes.find(hasHeadline) ?? doc.scenes[0];
  if (!scene) return 0;

  return scene.startMs + Math.round(scene.durationMs / 2);
}

function selectSaymo(serveUrl: string, doc: VideoDoc) {
  return selectComposition({ serveUrl, id: compositionId, inputProps: doc });
}

function hasHeadline(scene: Scene): boolean {
  return scene.elements.some((element) => element.kind === "headline");
}

// The composition loads run assets by root-relative URL, so the bundle serves `runs/` through a symlink.
async function linkRunsIntoBundle(serveUrl: string): Promise<string> {
  const link = resolve(serveUrl, "runs");
  if (!(await pathExists(link))) await symlink(runsDir, link, "dir");

  return serveUrl;
}

function pathExists(path: string): Promise<boolean> {
  return lstat(path).then(
    () => true,
    () => false,
  );
}
