import { existsSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClaude } from "../lib/ai/claude";
import { type Env, requireEnv } from "../lib/env";
import { errorMessage } from "../lib/errors";
import { fetchPageText } from "../lib/html";
import { readJson, writeJson } from "../lib/json";
import { elapsedMs, Metrics } from "../lib/metrics";
import { assertPricedModel } from "../lib/pricing";
import { defaultBrand } from "../video/brand";
import { type QaReport, QaReportSchema, runQa } from "../video/qa/checks";
import { renderOnLambda, uploadRunAssets } from "../video/render/renderLambda";
import { posterTimeMs, renderLocal, renderPoster } from "../video/render/renderLocal";
import { type ContentMap, ContentMapSchema, type FrameNote } from "../video/schema/content";
import { type Plan, PlanSchema } from "../video/schema/plan";
import { type Transcript, TranscriptSchema } from "../video/schema/transcript";
import { type VideoDoc, VideoDocSchema } from "../video/schema/video";
import {
  loadOrCreateManifest,
  type Manifest,
  type RunOptions,
  redoFrom,
  type StepName,
  saveManifest,
  shouldRun,
} from "./manifest";
import {
  type BuildAssets,
  buildVideo,
  keepOutForScenes,
  MusicManifestSchema,
  pickMusic,
  type SpokenBeat,
  SpokenBeatSchema,
} from "./steps/build/buildVideo";
import { direct } from "./steps/direct/director";
import { directLocally } from "./steps/direct/localDirector";
import type { DirectorInput } from "./steps/direct/prompts";
import { type IngestResult, IngestResultSchema, ingest } from "./steps/ingest";
import { WaitingError } from "./steps/local";
import { buildContentMap } from "./steps/see/contentMap";
import {
  assertVisionBudget,
  describeKeyframes,
  type Frame,
  selectFramesForDescription,
} from "./steps/see/describe";
import { detectFaces, rekognitionDetector } from "./steps/see/faces";
import { describeLocally } from "./steps/see/localVision";
import { deepgramTranscriber } from "./steps/transcribe/deepgram";
import { elevenLabsTranscriber } from "./steps/transcribe/elevenlabs";
import type { Transcriber } from "./steps/transcribe/types";
import { synthesizeVoice } from "./steps/voice/elevenlabsVoice";

export class QaFailedError extends Error {}

export type RunResult = {
  manifest: Manifest;
  planPath: string;
  docPath: string;
  outputPath?: string;
};

type Run = {
  options: RunOptions;
  env: Env;
  manifest: Manifest;
  metrics: Metrics;
  client: Anthropic;
};

type Step<T> = {
  name: StepName;
  file: string;
  schema: z.ZodType<T>;
  work: () => Promise<T>;
};

const SeenSchema = z.object({ faces: ContentMapSchema.shape.faces, frames: ContentMapSchema.shape.frames });
const VoiceAssetsSchema = z.array(SpokenBeatSchema);
const LambdaRenderSchema = z.object({ url: z.string(), ms: z.number(), usd: z.number() });
const LocalRenderSchema = z.object({ path: z.string(), ms: z.number() });

type Seen = z.infer<typeof SeenSchema>;

const musicManifestPath = "assets/music/manifest.json";
const emptyTranscript: Transcript = { language: "unknown", text: "", words: [] };

export async function runPipeline(options: RunOptions, env: Env): Promise<RunResult> {
  requireCredentials(options, env);
  const run = openRun(options, env);

  const ingested = options.source ? await ingestStep(run, options.source) : undefined;
  const content = ingested ? await analyzeSource(run, ingested) : null;
  if (!ingested) skip(run, "ingest", "transcribe", "see");

  const plan = await directStep(run, content);
  printQuestions(plan);

  const voice = await voiceStep(run, plan);
  const doc = await buildStep(run, plan, content, ingested, voice);
  const report = await qaStep(run, doc, plan, content);
  if (!report.ok) await failOnQa(run, report);

  const outputPath = await renderStep(run, doc);
  await finish(run);

  return {
    manifest: run.manifest,
    planPath: artifact(run, "plan.json"),
    docPath: artifact(run, "video.json"),
    ...(outputPath ? { outputPath } : {}),
  };
}

function requireCredentials(options: RunOptions, env: Env): void {
  const describesByApi = options.source !== undefined && options.vision === "api";
  const callsClaude = options.director === "api" || describesByApi;
  if (callsClaude && !process.env.ANTHROPIC_AUTH_TOKEN) requireEnv(env, "ANTHROPIC_API_KEY");
  if (options.director === "api") assertPricedModel(options.directorModel);
  if (describesByApi) assertPricedModel(options.visionModel);

  if (options.source) {
    requireEnv(env, options.transcriber === "deepgram" ? "DEEPGRAM_API_KEY" : "ELEVENLABS_API_KEY");
    requireEnv(env, "AWS_ACCESS_KEY_ID");
    requireEnv(env, "AWS_SECRET_ACCESS_KEY");
  }
  if (options.voice) requireEnv(env, "ELEVENLABS_API_KEY");
  if (options.render === "lambda") {
    requireEnv(env, "REMOTION_LAMBDA_FUNCTION_NAME");
    requireEnv(env, "REMOTION_SERVE_URL");
  }
}

function openRun(options: RunOptions, env: Env): Run {
  const loaded = loadOrCreateManifest(options.runDir, options);
  const manifest = options.redo ? redoFrom(loaded, options.redo) : loaded;

  return {
    options,
    env,
    manifest,
    metrics: Metrics.from(manifest.events),
    client: createClaude(env.ANTHROPIC_API_KEY),
  };
}

function ingestStep(run: Run, source: string): Promise<IngestResult> {
  return step(run, {
    name: "ingest",
    file: "ingest.json",
    schema: IngestResultSchema,
    work: async () => {
      const result = await ingest({ source: resolve(source), runDir: run.options.runDir });
      return { ...result, sourcePath: relativeToRepo(result.sourcePath) };
    },
  });
}

async function analyzeSource(run: Run, ingested: IngestResult): Promise<ContentMap> {
  const [transcript, seen] = await bothOrThrow(transcribeStep(run, ingested), seeStep(run, ingested));

  const content = buildContentMap({
    source: ingested.sourcePath,
    info: ingested.info,
    shots: ingested.shots,
    faces: seen.faces,
    frames: seen.frames,
    transcript,
  });
  await writeJson(artifact(run, "content.json"), content);

  return content;
}

function transcribeStep(run: Run, ingested: IngestResult): Promise<Transcript> {
  const { audioPath } = ingested;
  if (!audioPath) {
    skip(run, "transcribe");
    return Promise.resolve(emptyTranscript);
  }

  return step(run, {
    name: "transcribe",
    file: "transcript.json",
    schema: TranscriptSchema,
    work: async () => {
      const transcriber = pickTranscriber(run);
      const startedAt = performance.now();
      const { transcript, usd } = await transcriber.transcribe(audioPath, ingested.info.durationMs);

      run.metrics.record({ step: "transcribe", provider: transcriber.name, ms: elapsedMs(startedAt), usd });
      return transcript;
    },
  });
}

function pickTranscriber(run: Run): Transcriber {
  if (run.options.transcriber === "deepgram")
    return deepgramTranscriber(requireEnv(run.env, "DEEPGRAM_API_KEY"));
  return elevenLabsTranscriber(requireEnv(run.env, "ELEVENLABS_API_KEY"));
}

function seeStep(run: Run, ingested: IngestResult): Promise<Seen> {
  return step(run, {
    name: "see",
    file: "see.json",
    schema: SeenSchema,
    work: async () => {
      const frames = await describeFrames(
        run,
        selectFramesForDescription(ingested.keyframes, ingested.shots),
      );
      const faces = await detectFaces(
        rekognitionDetector(run.env.AWS_REGION),
        ingested.keyframes,
        run.metrics,
      );

      return { faces, frames };
    },
  });
}

// Frames are described before faces are detected, so a run waiting for local descriptions pays for nothing.
function describeFrames(run: Run, frames: Frame[]): Promise<FrameNote[]> {
  if (run.options.vision === "local") return describeLocally(frames, artifact(run, "vision"));

  assertVisionBudget(frames.length, run.options.visionModel, run.env.SAYMO_VISION_BUDGET_USD);
  return describeKeyframes({
    client: run.client,
    model: run.options.visionModel,
    frames,
    budgetUsd: run.env.SAYMO_VISION_BUDGET_USD,
    metrics: run.metrics,
  });
}

function directStep(run: Run, content: ContentMap | null): Promise<Plan> {
  return step(run, {
    name: "direct",
    file: "plan.json",
    schema: PlanSchema,
    work: async () => {
      const input = await directorInput(run, content);
      if (run.options.director === "local") return directLocally(input, artifact(run, "director"));

      return direct(input, { client: run.client, model: run.options.directorModel, metrics: run.metrics });
    },
  });
}

async function directorInput(run: Run, content: ContentMap | null): Promise<DirectorInput> {
  const { options } = run;
  const input: DirectorInput = {
    mode: options.source ? "footage" : "text",
    destination: options.destination,
    brand: defaultBrand,
  };

  if (content) input.content = content;
  if (options.text) input.text = options.text;
  if (options.url) input.pageText = await fetchPageText(options.url);

  return input;
}

function voiceStep(run: Run, plan: Plan): Promise<SpokenBeat[]> {
  const wanted = !run.options.source && run.options.voice && plan.voiceover;
  if (!wanted) {
    skip(run, "voice");
    return Promise.resolve([]);
  }

  return step(run, {
    name: "voice",
    file: "voice.json",
    schema: VoiceAssetsSchema,
    work: async () => {
      const apiKey = requireEnv(run.env, "ELEVENLABS_API_KEY");
      const spoken: SpokenBeat[] = [];

      for (const beat of plan.beats) {
        if (!beat.voiceText) continue;
        const outPath = join(run.options.runDir, "voice", `${beat.id}.mp3`);
        const result = await synthesizeVoice({
          apiKey,
          voiceId: run.options.voiceId,
          text: beat.voiceText,
          outPath,
          metrics: run.metrics,
        });
        spoken.push({
          beatId: beat.id,
          path: relativeToRepo(outPath),
          durationMs: result.durationMs,
          words: result.words,
        });
      }

      return spoken;
    },
  });
}

function buildStep(
  run: Run,
  plan: Plan,
  content: ContentMap | null,
  ingested: IngestResult | undefined,
  voice: SpokenBeat[],
): Promise<VideoDoc> {
  return step(run, {
    name: "build",
    file: "video.json",
    schema: VideoDocSchema,
    work: async () => {
      const assets: BuildAssets = {};
      if (ingested) assets.sourceVideo = { path: ingested.sourcePath, info: ingested.info };
      if (voice.length > 0) assets.voice = voice;

      const music = await copyMusicIntoRun(run, plan.musicMood);
      if (music) assets.music = music;

      return buildVideo(plan, content, assets, defaultBrand);
    },
  });
}

async function copyMusicIntoRun(run: Run, mood: string): Promise<BuildAssets["music"]> {
  const manifest = await readJson(musicManifestPath, MusicManifestSchema);
  const track = pickMusic(manifest, mood);
  if (!track) return undefined;

  const copied = join(run.options.runDir, basename(track.path));
  await copyFile(track.path, copied);

  return { path: relativeToRepo(copied), durationMs: track.durationMs };
}

function qaStep(run: Run, doc: VideoDoc, plan: Plan, content: ContentMap | null): Promise<QaReport> {
  return step(run, {
    name: "qa",
    file: "qa.json",
    schema: QaReportSchema,
    work: async () =>
      runQa(doc, plan, keepOutForScenes(doc, plan, content), content?.source.durationMs ?? null),
  });
}

async function failOnQa(run: Run, report: QaReport): Promise<never> {
  const errors = report.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join("; ");

  run.manifest.steps.render = { status: "failed", error: errors };
  await finish(run);

  throw new QaFailedError(`QA failed: ${errors}`);
}

async function renderStep(run: Run, doc: VideoDoc): Promise<string | undefined> {
  switch (run.options.render) {
    case "none":
      skip(run, "render");
      return undefined;
    case "lambda":
      return (await renderOnLambdaStep(run, doc)).url;
    case "local":
      return (await renderLocallyStep(run, doc)).path;
  }
}

function renderOnLambdaStep(run: Run, doc: VideoDoc) {
  return step(run, {
    name: "render",
    file: "lambda.json",
    schema: LambdaRenderSchema,
    work: async () => {
      const uploaded = await uploadRunAssets(doc, run.manifest.id, run.env);
      return renderOnLambda({
        doc: uploaded,
        outName: `${run.manifest.id}.mp4`,
        env: run.env,
        metrics: run.metrics,
      });
    },
  });
}

function renderLocallyStep(run: Run, doc: VideoDoc) {
  return step(run, {
    name: "render",
    file: "render.json",
    schema: LocalRenderSchema,
    work: async () => {
      const path = artifact(run, "out.mp4");
      const { ms } = await renderLocal(doc, path);
      await renderPoster(doc, artifact(run, "poster.jpg"), posterTimeMs(doc));

      run.metrics.record({ step: "render", provider: "ffmpeg", ms, usd: 0, detail: { where: "local" } });
      return { path, ms };
    },
  });
}

// A step's result is its artifact: a resumed run reads the file back instead of paying for the work again.
async function step<T>(run: Run, spec: Step<T>): Promise<T> {
  const file = artifact(run, spec.file);
  if (!shouldRun(run.manifest, spec.name, run.options.resume) && existsSync(file))
    return readJson(file, spec.schema);

  run.metrics.drop(spec.name);
  const startedAt = performance.now();

  try {
    const value = await spec.work();
    await writeJson(file, value);
    run.manifest.steps[spec.name] = { status: "done", ms: elapsedMs(startedAt) };
    save(run);
    return value;
  } catch (error) {
    const status = error instanceof WaitingError ? "waiting" : "failed";
    run.manifest.steps[spec.name] = { status, error: errorMessage(error) };
    save(run);
    throw error;
  }
}

// Both tasks settle before either failure is thrown, so the manifest records the outcome of each.
async function bothOrThrow<A, B>(first: Promise<A>, second: Promise<B>): Promise<[A, B]> {
  const [a, b] = await Promise.allSettled([first, second]);
  if (a.status === "rejected") throw a.reason;
  if (b.status === "rejected") throw b.reason;

  return [a.value, b.value];
}

function skip(run: Run, ...names: StepName[]): void {
  for (const name of names) run.manifest.steps[name] = { status: "skipped" };
}

function save(run: Run): void {
  run.manifest.events = run.metrics.toJSON();
  saveManifest(run.options.runDir, run.manifest);
}

async function finish(run: Run): Promise<void> {
  save(run);
  await writeJson(artifact(run, "metrics.json"), {
    events: run.metrics.toJSON(),
    byStep: run.metrics.byStep(),
    total: run.metrics.total(),
  });
}

function artifact(run: Run, name: string): string {
  return join(run.options.runDir, name);
}

function relativeToRepo(path: string): string {
  return relative(process.cwd(), resolve(path));
}

function printQuestions(plan: Plan): void {
  if (plan.questions.length === 0) return;

  console.log("Director questions (answered with defaults):");
  for (const question of plan.questions) {
    console.log(`  ${question.text}`);
    console.log(`    options: ${question.options.join(" | ")}`);
    console.log(`    default: ${question.defaultOption}`);
  }
}
