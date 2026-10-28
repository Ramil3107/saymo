import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { z } from "zod";
import { createClaude } from "../lib/ai/claude";
import { type Env, requireEnv } from "../lib/env";
import { fetchPageText } from "../lib/html";
import { Metrics } from "../lib/metrics";
import { avoidZones } from "../video/layout/avoidZones";
import { runQa } from "../video/qa/checks";
import {
  posterTimeMs,
  renderLocal,
  renderPoster,
} from "../video/render/renderLocal";
import { type ContentMap, ContentMapSchema } from "../video/schema/content";
import { type Plan, PlanSchema } from "../video/schema/plan";
import { TranscriptSchema } from "../video/schema/transcript";
import { type VideoDoc, VideoDocSchema } from "../video/schema/video";
import {
  loadOrCreateManifest,
  type Manifest,
  type RunOptions,
  type StepName,
  saveManifest,
  shouldRun,
} from "./manifest";
import {
  type BuildAssets,
  buildVideo,
  pickMusic,
} from "./steps/build/buildVideo";
import { direct } from "./steps/direct/director";
import type { DirectorInput } from "./steps/direct/prompts";
import { type IngestResult, ingest } from "./steps/ingest";
import { buildContentMap } from "./steps/see/contentMap";
import {
  describeKeyframes,
  selectFramesForDescription,
} from "./steps/see/describe";
import { detectFaces, rekognitionDetector } from "./steps/see/faces";
import { deepgramTranscriber } from "./steps/transcribe/deepgram";
import { elevenLabsTranscriber } from "./steps/transcribe/elevenlabs";
import { synthesizeVoice } from "./steps/voice/elevenlabsVoice";

export const defaultBrand: VideoDoc["brand"] = {
  colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"],
  font: "Onest",
};

export class QaFailedError extends Error {}

const MusicManifestSchema = z.object({
  tracks: z.array(
    z.object({
      file: z.string(),
      title: z.string(),
      mood: z.string(),
      bpm: z.number(),
      license: z.string(),
      source: z.string(),
      durationMs: z.number(),
    }),
  ),
});

type RunResult = {
  manifest: Manifest;
  planPath: string;
  docPath: string;
  outputPath?: string;
};

function requireCredentials(options: RunOptions, env: Env): void {
  if (!process.env.ANTHROPIC_AUTH_TOKEN) requireEnv(env, "ANTHROPIC_API_KEY");
  if (options.source) {
    requireEnv(
      env,
      options.transcriber === "deepgram"
        ? "DEEPGRAM_API_KEY"
        : "ELEVENLABS_API_KEY",
    );
    requireEnv(env, "AWS_ACCESS_KEY_ID");
    requireEnv(env, "AWS_SECRET_ACCESS_KEY");
  }
  if (options.voice) requireEnv(env, "ELEVENLABS_API_KEY");
}

async function readJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(JSON.parse(await readFile(path, "utf8")));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function printQuestions(plan: Plan): void {
  if (plan.questions.length === 0) return;
  console.log("Director questions (answered with defaults):");
  for (const question of plan.questions) {
    console.log(
      `  ${question.text}\n    options: ${question.options.join(" | ")}\n    default: ${question.defaultOption}`,
    );
  }
}

export async function runPipeline(
  options: RunOptions,
  env: Env,
): Promise<RunResult> {
  requireCredentials(options, env);
  const manifest = loadOrCreateManifest(options.runDir, options);
  const metrics = Metrics.from(manifest.events);
  const client = createClaude(env.ANTHROPIC_API_KEY);
  const artifact = (name: string) => join(options.runDir, name);
  const save = () => {
    manifest.events = metrics.toJSON();
    saveManifest(options.runDir, manifest);
  };

  async function step<T>(
    name: StepName,
    file: string | null,
    run: () => Promise<T>,
    load: () => Promise<T>,
  ): Promise<T> {
    if (
      !shouldRun(manifest, name, options.resume) &&
      file &&
      existsSync(artifact(file))
    )
      return load();
    const startedAt = performance.now();
    try {
      const value = await run();
      manifest.steps[name] = {
        status: "done",
        ms: Math.round(performance.now() - startedAt),
      };
      save();
      return value;
    } catch (error) {
      manifest.steps[name] = {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
      save();
      throw error;
    }
  }

  const skip = (name: StepName) => {
    manifest.steps[name] = { status: "skipped" };
  };

  const mode: DirectorInput["mode"] = options.source ? "footage" : "text";
  let content: ContentMap | null = null;
  let ingested: IngestResult | undefined;

  if (options.source) {
    const source = relative(process.cwd(), resolve(options.source));
    ingested = await step(
      "ingest",
      "ingest.json",
      async () => {
        const result = await ingest({ source, runDir: options.runDir });
        await writeJson(artifact("ingest.json"), result);
        return result;
      },
      () =>
        readJson(artifact("ingest.json"), z.any() as z.ZodType<IngestResult>),
    );
    const audioPath = ingested.audioPath;
    const info = ingested.info;
    const [transcript, seen] = await Promise.all([
      step(
        "transcribe",
        "transcript.json",
        async () => {
          const transcriber =
            options.transcriber === "deepgram"
              ? deepgramTranscriber(requireEnv(env, "DEEPGRAM_API_KEY"))
              : elevenLabsTranscriber(requireEnv(env, "ELEVENLABS_API_KEY"));
          const startedAt = performance.now();
          const { transcript, usd } = await transcriber.transcribe(
            audioPath,
            info.durationMs,
          );
          metrics.record({
            step: "transcribe",
            provider: transcriber.name,
            ms: Math.round(performance.now() - startedAt),
            usd,
          });
          await writeJson(artifact("transcript.json"), transcript);
          return transcript;
        },
        () => readJson(artifact("transcript.json"), TranscriptSchema),
      ),
      step(
        "see",
        "see.json",
        async () => {
          const keyframes = ingested?.keyframes ?? [];
          const faces = await detectFaces(
            rekognitionDetector(env.AWS_REGION),
            keyframes,
            metrics,
          );
          const frames = await describeKeyframes({
            client,
            model: options.visionModel,
            frames: selectFramesForDescription(
              keyframes,
              ingested?.shots ?? [],
            ),
            budgetUsd: env.SAYMO_VISION_BUDGET_USD,
            metrics,
          });
          const result = { faces, frames };
          await writeJson(artifact("see.json"), result);
          return result;
        },
        () =>
          readJson(
            artifact("see.json"),
            z.object({
              faces: ContentMapSchema.shape.faces,
              frames: ContentMapSchema.shape.frames,
            }),
          ),
      ),
    ]);
    content = buildContentMap({
      source,
      info,
      shots: ingested.shots,
      faces: seen.faces,
      frames: seen.frames,
      transcript,
    });
    await writeJson(artifact("content.json"), content);
  } else {
    skip("ingest");
    skip("transcribe");
    skip("see");
  }

  const plan = await step(
    "direct",
    "plan.json",
    async () => {
      const input: DirectorInput = {
        mode,
        destination: options.destination,
        brand: defaultBrand,
      };
      if (content) input.content = content;
      if (options.text) input.text = options.text;
      if (options.url) input.pageText = await fetchPageText(options.url);
      const result = await direct(input, {
        client,
        model: options.directorModel,
        metrics,
      });
      await writeJson(artifact("plan.json"), result);
      return result;
    },
    () => readJson(artifact("plan.json"), PlanSchema),
  );
  printQuestions(plan);

  const VoiceAssetsSchema = z.array(
    z.object({
      beatId: z.string(),
      path: z.string(),
      durationMs: z.number(),
      words: TranscriptSchema.shape.words,
    }),
  );
  let voice: NonNullable<BuildAssets["voice"]> = [];
  if (mode === "text" && options.voice && plan.voiceover) {
    voice = await step(
      "voice",
      "voice.json",
      async () => {
        const apiKey = requireEnv(env, "ELEVENLABS_API_KEY");
        const spoken: NonNullable<BuildAssets["voice"]> = [];
        for (const beat of plan.beats) {
          if (!beat.voiceText) continue;
          const outPath = join(options.runDir, "voice", `${beat.id}.mp3`);
          const result = await synthesizeVoice({
            apiKey,
            voiceId: options.voiceId,
            text: beat.voiceText,
            outPath,
            metrics,
          });
          spoken.push({
            beatId: beat.id,
            path: relative(process.cwd(), resolve(outPath)),
            durationMs: result.durationMs,
            words: result.words,
          });
        }
        await writeJson(artifact("voice.json"), spoken);
        return spoken;
      },
      () => readJson(artifact("voice.json"), VoiceAssetsSchema),
    );
  } else {
    skip("voice");
  }

  const doc = await step(
    "build",
    "video.json",
    async () => {
      const assets: BuildAssets = {};
      if (options.source && ingested)
        assets.sourceVideo = {
          path: relative(process.cwd(), resolve(options.source)),
          info: ingested.info,
        };
      const musicManifest = MusicManifestSchema.parse(
        JSON.parse(await readFile("assets/music/manifest.json", "utf8")),
      );
      const music = pickMusic(musicManifest, plan.musicMood);
      if (music) assets.music = music;
      if (voice.length > 0) assets.voice = voice;
      const built = buildVideo(plan, content, assets, defaultBrand);
      await writeJson(artifact("video.json"), built);
      return built;
    },
    () => readJson(artifact("video.json"), VideoDocSchema),
  );

  const report = await step(
    "qa",
    "qa.json",
    async () => {
      const avoid = Object.fromEntries(
        plan.beats.map((beat) => [
          beat.id,
          beat.footage && content
            ? avoidZones(content.faces, {
                startMs: beat.footage.fromMs,
                endMs: beat.footage.toMs,
              })
            : [],
        ]),
      );
      const result = runQa(
        doc,
        plan,
        avoid,
        content?.source.durationMs ?? null,
      );
      await writeJson(artifact("qa.json"), result);
      return result;
    },
    () =>
      readJson(
        artifact("qa.json"),
        z.any() as z.ZodType<ReturnType<typeof runQa>>,
      ),
  );

  let outputPath: string | undefined;
  if (!report.ok) {
    const errors = report.issues
      .filter((i) => i.severity === "error")
      .map((i) => `${i.code}: ${i.message}`);
    manifest.steps.render = { status: "failed", error: errors.join("; ") };
    save();
    await writeJson(artifact("metrics.json"), {
      events: metrics.toJSON(),
      byStep: metrics.byStep(),
      total: metrics.total(),
    });
    throw new QaFailedError(`QA failed: ${errors.join("; ")}`);
  }
  if (options.render === "none") {
    skip("render");
  } else if (options.render === "lambda") {
    throw new Error("Lambda rendering arrives in Task 15");
  } else {
    outputPath = await step(
      "render",
      "out.mp4",
      async () => {
        const out = artifact("out.mp4");
        const { ms } = await renderLocal(doc, out);
        await renderPoster(doc, artifact("poster.jpg"), posterTimeMs(doc));
        metrics.record({
          step: "render",
          provider: "ffmpeg",
          ms,
          usd: 0,
          detail: { where: "local" },
        });
        return out;
      },
      async () => artifact("out.mp4"),
    );
  }
  save();
  await writeJson(artifact("metrics.json"), {
    events: metrics.toJSON(),
    byStep: metrics.byStep(),
    total: metrics.total(),
  });
  return {
    manifest,
    planPath: artifact("plan.json"),
    docPath: artifact("video.json"),
    ...(outputPath ? { outputPath } : {}),
  };
}
