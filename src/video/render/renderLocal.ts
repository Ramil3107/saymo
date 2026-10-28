import { lstat, mkdir, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import { msToFrame } from "../remotion/frames";
import type { VideoDoc } from "../schema/video";

const compositionId = "saymo";
const entryPoint = resolve("src/video/remotion/index.ts");
const bundleDir = resolve(".remotion/bundle");
const runsDir = resolve("runs");

let bundled: Promise<string> | undefined;

async function linkRunsIntoBundle(serveUrl: string): Promise<string> {
  const link = resolve(serveUrl, "runs");
  const exists = await lstat(link).then(
    () => true,
    () => false,
  );
  if (!exists) await symlink(runsDir, link, "dir");
  return serveUrl;
}

export function bundleOnce(): Promise<string> {
  bundled ??= bundle({ entryPoint, outDir: bundleDir }).then(
    linkRunsIntoBundle,
  );
  return bundled;
}

export function posterTimeMs(doc: VideoDoc): number {
  const scene =
    doc.scenes.find((s) => s.elements.some((e) => e.kind === "headline")) ??
    doc.scenes[0];
  if (!scene) return 0;
  return scene.startMs + Math.round(scene.durationMs / 2);
}

async function composition(serveUrl: string, doc: VideoDoc) {
  return selectComposition({ serveUrl, id: compositionId, inputProps: doc });
}

export async function renderLocal(
  doc: VideoDoc,
  outPath: string,
): Promise<{ ms: number }> {
  const startedAt = performance.now();
  const serveUrl = await bundleOnce();
  await mkdir(dirname(outPath), { recursive: true });
  await renderMedia({
    composition: await composition(serveUrl, doc),
    serveUrl,
    codec: "h264",
    outputLocation: outPath,
    inputProps: doc,
  });
  return { ms: Math.round(performance.now() - startedAt) };
}

export async function renderPoster(
  doc: VideoDoc,
  outPath: string,
  atMs: number,
): Promise<void> {
  const serveUrl = await bundleOnce();
  await mkdir(dirname(outPath), { recursive: true });
  await renderStill({
    composition: await composition(serveUrl, doc),
    serveUrl,
    output: outPath,
    frame: msToFrame(atMs, doc.fps),
    imageFormat: "jpeg",
    inputProps: doc,
  });
}
