import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { loadEnv } from "../lib/env";
import { Metrics } from "../lib/metrics";
import { DestinationIdSchema } from "../video/destinations";
import { QaFailedError, runPipeline } from "../worker/run";

if (existsSync(".env")) process.loadEnvFile(".env");
const env = loadEnv();

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    text: { type: "string" },
    url: { type: "string" },
    to: { type: "string", default: "reels" },
    transcriber: { type: "string", default: "elevenlabs" },
    "director-model": { type: "string", default: env.SAYMO_DIRECTOR_MODEL },
    "vision-model": { type: "string", default: env.SAYMO_VISION_MODEL },
    voice: { type: "boolean", default: false },
    "voice-id": { type: "string", default: "21m00Tcm4TlvDq8ikWAM" },
    render: { type: "string", default: "local" },
    resume: { type: "boolean", default: false },
    run: { type: "string" },
  },
});

const source = positionals[0];
if (!source && !values.text) {
  console.error(
    'Usage: pnpm spike <video> | --text "..." [--url ...] [--to reels] [--transcriber elevenlabs|deepgram] [--voice] [--render local|lambda|none] [--resume --run <id>]',
  );
  process.exit(1);
}

const slug = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "run";
const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .slice(0, 13)
  .replace("T", "-");
const runId =
  values.run ??
  `${stamp}-${slug(source ? basename(source, ".mp4") : (values.text as string))}`;

const transcriber =
  values.transcriber === "deepgram" ? "deepgram" : "elevenlabs";
const render =
  values.render === "lambda"
    ? "lambda"
    : values.render === "none"
      ? "none"
      : "local";

try {
  const result = await runPipeline(
    {
      ...(source ? { source } : {}),
      ...(values.text ? { text: values.text } : {}),
      ...(values.url ? { url: values.url } : {}),
      destination: DestinationIdSchema.parse(values.to),
      runDir: join("runs", runId),
      transcriber,
      directorModel: values["director-model"] as string,
      visionModel: values["vision-model"] as string,
      voice: values.voice,
      voiceId: values["voice-id"] as string,
      render,
      resume: values.resume,
    },
    env,
  );
  const metrics = Metrics.from(result.manifest.events);
  console.table(metrics.byStep());
  const total = metrics.total();
  console.log(
    `total: ${(total.ms / 1000).toFixed(1)} s, $${total.usd.toFixed(4)}`,
  );
  console.log(
    `run: ${result.manifest.id}${result.outputPath ? `, output: ${result.outputPath}` : ""}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(error instanceof QaFailedError ? 2 : 1);
}
