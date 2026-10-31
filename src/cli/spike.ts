import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { type Env, loadEnv } from "../lib/env";
import { errorMessage } from "../lib/errors";
import { Metrics } from "../lib/metrics";
import { type RunOptions, RunOptionsSchema } from "../worker/manifest";
import { QaFailedError, type RunResult, runPipeline } from "../worker/run";
import { WaitingError } from "../worker/steps/local";

const usage =
  'Usage: pnpm spike <video> | --text "..." [--url ...] [--to reels] [--director local|api] [--vision local|api] [--transcriber elevenlabs|deepgram] [--voice] [--render local|lambda|none] [--resume --run <id>] [--redo <step> --run <id>]';
const defaultVoiceId = "21m00Tcm4TlvDq8ikWAM";
const maxSlugLength = 32;
const qaFailedExitCode = 2;
const waitingExitCode = 3;

await main();

async function main(): Promise<void> {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const env = loadEnv();
  const options = parseOptions(env);

  try {
    printSummary(await runPipeline(options, env));
  } catch (error) {
    console.error(errorMessage(error));
    process.exit(exitCode(error));
  }
}

function parseOptions(env: Env): RunOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      text: { type: "string" },
      url: { type: "string" },
      to: { type: "string", default: "reels" },
      transcriber: { type: "string", default: "elevenlabs" },
      director: { type: "string", default: "local" },
      "director-model": { type: "string", default: env.SAYMO_DIRECTOR_MODEL },
      vision: { type: "string", default: "local" },
      "vision-model": { type: "string", default: env.SAYMO_VISION_MODEL },
      voice: { type: "boolean", default: false },
      "voice-id": { type: "string", default: defaultVoiceId },
      render: { type: "string", default: "local" },
      resume: { type: "boolean", default: false },
      redo: { type: "string" },
      run: { type: "string" },
    },
  });

  const source = positionals[0];
  if (!source && !values.text) exitWithUsage();
  const runId = values.run ?? newRunId(source ? basename(source, ".mp4") : (values.text ?? ""));

  return RunOptionsSchema.parse({
    source,
    text: values.text,
    url: values.url,
    destination: values.to,
    runDir: join("runs", runId),
    transcriber: values.transcriber,
    director: values.director,
    directorModel: values["director-model"],
    vision: values.vision,
    visionModel: values["vision-model"],
    voice: values.voice,
    voiceId: values["voice-id"],
    render: values.render,
    resume: values.resume || values.redo !== undefined,
    redo: values.redo,
  });
}

function exitCode(error: unknown): number {
  if (error instanceof WaitingError) return waitingExitCode;
  return error instanceof QaFailedError ? qaFailedExitCode : 1;
}

function exitWithUsage(): never {
  console.error(usage);
  process.exit(1);
}

function newRunId(label: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13).replace("T", "-");
  return `${stamp}-${slug(label)}`;
}

function slug(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxSlugLength);

  return cleaned || "run";
}

function printSummary(result: RunResult): void {
  const metrics = Metrics.from(result.manifest.events);
  const total = metrics.total();

  console.table(metrics.byStep());
  console.log(`total: ${(total.ms / 1000).toFixed(1)} s, $${total.usd.toFixed(4)}`);
  console.log(`run: ${result.manifest.id}${result.outputPath ? `, output: ${result.outputPath}` : ""}`);
}
