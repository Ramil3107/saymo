import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { makeTestVideo, probe } from "../lib/ffmpeg";
import { readJson } from "../lib/json";
import { defaultBrand } from "../video/brand";
import { posterTimeMs, renderLocal, renderPoster } from "../video/render/renderLocal";
import { ContentMapSchema } from "../video/schema/content";
import { PlanSchema } from "../video/schema/plan";
import { type VideoDoc, VideoDocSchema } from "../video/schema/video";
import { buildVideo } from "../worker/steps/build/buildVideo";

const outDir = resolve("runs/render-test");
const testVideoSeconds = 50;

await main();

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { footage: { type: "boolean", default: false } } });
  const doc = values.footage
    ? await footageDocument()
    : await readJson("fixtures/video.sample.json", VideoDocSchema);
  const suffix = values.footage ? "-footage" : "";

  await renderPoster(doc, join(outDir, `poster${suffix}.jpg`), posterTimeMs(doc));
  console.log(`poster at ${posterTimeMs(doc)} ms`);

  const { ms } = await renderLocal(doc, join(outDir, `out${suffix}.mp4`));
  console.log(`rendered in ${ms} ms`);
}

async function footageDocument(): Promise<VideoDoc> {
  const source = relative(process.cwd(), join(outDir, "source.mp4"));
  await makeTestVideo(source, testVideoSeconds);

  const info = await probe(source);
  const content = await readJson("fixtures/content.sample.json", ContentMapSchema);
  const plan = await readJson("fixtures/plan.footage.json", PlanSchema);

  return buildVideo(
    plan,
    { ...content, source: { ...info, path: source } },
    { sourceVideo: { path: source, info } },
    defaultBrand,
  );
}
