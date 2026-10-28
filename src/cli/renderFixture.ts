import { readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { makeTestVideo, probe } from "../lib/ffmpeg";
import {
  posterTimeMs,
  renderLocal,
  renderPoster,
} from "../video/render/renderLocal";
import { ContentMapSchema } from "../video/schema/content";
import { PlanSchema } from "../video/schema/plan";
import { type VideoDoc, VideoDocSchema } from "../video/schema/video";
import { buildVideo } from "../worker/steps/build/buildVideo";

const outDir = resolve("runs/render-test");
const brand = { colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"], font: "Onest" };

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function footageDocument(): Promise<VideoDoc> {
  const source = relative(process.cwd(), join(outDir, "source.mp4"));
  await makeTestVideo(source, 50);
  const info = await probe(source);
  const content = ContentMapSchema.parse(
    await readJson("fixtures/content.sample.json"),
  );
  const plan = PlanSchema.parse(await readJson("fixtures/plan.footage.json"));
  return buildVideo(
    plan,
    { ...content, source: { ...info, path: source } },
    { sourceVideo: { path: source, info } },
    brand,
  );
}

const { values } = parseArgs({
  options: { footage: { type: "boolean", default: false } },
});
const doc = values.footage
  ? await footageDocument()
  : VideoDocSchema.parse(await readJson("fixtures/video.sample.json"));
const suffix = values.footage ? "-footage" : "";
await renderPoster(doc, join(outDir, `poster${suffix}.jpg`), posterTimeMs(doc));
console.log(`poster at ${posterTimeMs(doc)} ms`);
if (!values.footage) {
  const { ms } = await renderLocal(doc, join(outDir, "out.mp4"));
  console.log(`rendered in ${ms} ms`);
}
