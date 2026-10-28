import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { z } from "zod";
import { providers } from "../lib/metrics";
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

export const stepNames = ["ingest", "transcribe", "see", "direct", "voice", "build", "qa", "render"] as const;

export type StepName = (typeof stepNames)[number];

const StepStateSchema = z.object({
  status: z.enum(["pending", "done", "failed", "skipped"]),
  ms: z.number().optional(),
  error: z.string().optional(),
});

export type StepState = z.infer<typeof StepStateSchema>;

const UsageEventSchema = z.object({
  step: z.string(),
  provider: z.enum(providers),
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

export type Manifest = z.infer<typeof ManifestSchema> & { steps: Record<StepName, StepState> };

export function loadOrCreateManifest(runDir: string, options: RunOptions): Manifest {
  mkdirSync(runDir, { recursive: true });

  const existing = readManifest(runDir);
  if (existing) return { ...existing, options };

  const manifest = newManifest(runDir, options);
  saveManifest(runDir, manifest);
  return manifest;
}

export function saveManifest(runDir: string, manifest: Manifest): void {
  writeFileSync(manifestFile(runDir), `${JSON.stringify(manifest, null, 2)}\n`);
}

export function shouldRun(manifest: Manifest, step: StepName, resume: boolean): boolean {
  return !(resume && manifest.steps[step].status === "done");
}

function readManifest(runDir: string): Manifest | undefined {
  const file = manifestFile(runDir);
  if (!existsSync(file)) return undefined;

  return ManifestSchema.parse(JSON.parse(readFileSync(file, "utf8")));
}

function newManifest(runDir: string, options: RunOptions): Manifest {
  return {
    id: basename(runDir),
    createdAt: new Date().toISOString(),
    options,
    steps: pendingSteps(),
    events: [],
  };
}

function pendingSteps(): Manifest["steps"] {
  const pending = (): StepState => ({ status: "pending" });

  return {
    ingest: pending(),
    transcribe: pending(),
    see: pending(),
    direct: pending(),
    voice: pending(),
    build: pending(),
    qa: pending(),
    render: pending(),
  };
}

function manifestFile(runDir: string): string {
  return join(runDir, "manifest.json");
}
