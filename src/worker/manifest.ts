import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { UsageEvent } from "../lib/metrics";
import { DestinationIdSchema } from "../video/destinations";

export const RunOptionsSchema = z.object({
  source: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  destination: DestinationIdSchema,
  runDir: z.string(),
  transcriber: z.enum(["elevenlabs", "deepgram"]),
  directorModel: z.string(),
  visionModel: z.string(),
  voice: z.boolean(),
  voiceId: z.string(),
  render: z.enum(["local", "lambda", "none"]),
  resume: z.boolean(),
});
export type RunOptions = z.infer<typeof RunOptionsSchema>;

export const stepNames = [
  "ingest",
  "transcribe",
  "see",
  "direct",
  "voice",
  "build",
  "qa",
  "render",
] as const;
export type StepName = (typeof stepNames)[number];

const StepStateSchema = z.object({
  status: z.enum(["pending", "done", "failed", "skipped"]),
  ms: z.number().optional(),
  error: z.string().optional(),
});

const UsageEventSchema = z.object({
  step: z.string(),
  provider: z.enum([
    "anthropic",
    "elevenlabs",
    "deepgram",
    "rekognition",
    "lambda",
    "ffmpeg",
  ]),
  ms: z.number(),
  usd: z.number(),
  detail: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export const ManifestSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  options: RunOptionsSchema,
  steps: z.record(z.enum(stepNames), StepStateSchema),
  events: z.array(UsageEventSchema),
});
export type Manifest = z.infer<typeof ManifestSchema> & {
  steps: Record<StepName, z.infer<typeof StepStateSchema>>;
};

const manifestFile = (runDir: string) => join(runDir, "manifest.json");

export function loadOrCreateManifest(
  runDir: string,
  options: RunOptions,
): Manifest {
  mkdirSync(runDir, { recursive: true });
  const file = manifestFile(runDir);
  if (existsSync(file)) {
    const existing = ManifestSchema.parse(
      JSON.parse(readFileSync(file, "utf8")),
    );
    return { ...existing, options } as Manifest;
  }
  const steps = Object.fromEntries(
    stepNames.map((name) => [name, { status: "pending" }]),
  ) as Manifest["steps"];
  const manifest: Manifest = {
    id: runDir.split("/").at(-1) ?? runDir,
    createdAt: new Date().toISOString(),
    options,
    steps,
    events: [] as UsageEvent[],
  };
  saveManifest(runDir, manifest);
  return manifest;
}

export function saveManifest(runDir: string, manifest: Manifest): void {
  writeFileSync(manifestFile(runDir), `${JSON.stringify(manifest, null, 2)}\n`);
}

export function shouldRun(
  manifest: Manifest,
  step: StepName,
  resume: boolean,
): boolean {
  return !(resume && manifest.steps[step].status === "done");
}
