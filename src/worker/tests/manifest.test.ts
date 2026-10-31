import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  loadOrCreateManifest,
  type RunOptions,
  redoFrom,
  type StepName,
  saveManifest,
  shouldRun,
} from "../manifest";

const options: RunOptions = {
  text: "Reports now export to PDF",
  destination: "reels",
  runDir: "runs/test",
  transcriber: "elevenlabs",
  director: "local",
  vision: "local",
  directorModel: "claude-opus-5-5",
  visionModel: "claude-opus-5-5",
  voice: false,
  voiceId: "21m00Tcm4TlvDq8ikWAM",
  render: "none",
  resume: false,
};

test("loadOrCreateManifest creates a file with eight pending steps", () => {
  const runDir = mkdtempSync(join(tmpdir(), "saymo-manifest-"));
  const manifest = loadOrCreateManifest(runDir, { ...options, runDir });
  expect(Object.keys(manifest.steps)).toEqual([
    "ingest",
    "transcribe",
    "see",
    "direct",
    "voice",
    "build",
    "qa",
    "render",
  ]);
  expect(Object.values(manifest.steps).every((s) => s.status === "pending")).toBe(true);
  expect(existsSync(join(runDir, "manifest.json"))).toBe(true);
});

test("shouldRun skips done steps only when resuming", () => {
  const runDir = mkdtempSync(join(tmpdir(), "saymo-manifest-"));
  const manifest = loadOrCreateManifest(runDir, { ...options, runDir });
  manifest.steps.direct = { status: "done", ms: 1200 };
  saveManifest(runDir, manifest);
  const reloaded = loadOrCreateManifest(runDir, {
    ...options,
    runDir,
    resume: true,
  });
  expect(reloaded.steps.direct.status).toBe("done");
  expect(shouldRun(reloaded, "direct", true)).toBe(false);
  expect(shouldRun(reloaded, "direct", false)).toBe(true);
  expect(shouldRun(reloaded, "build", true)).toBe(true);
  expect(JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8")).steps.direct.ms).toBe(1200);
});

test("redoFrom resets a step and every step after it", () => {
  const runDir = mkdtempSync(join(tmpdir(), "saymo-manifest-"));
  const manifest = loadOrCreateManifest(runDir, { ...options, runDir });
  const done: StepName[] = ["ingest", "direct", "build"];
  for (const step of done) manifest.steps[step] = { status: "done" };

  const redone = redoFrom(manifest, "direct");
  expect(redone.steps.ingest.status).toBe("done");
  expect(redone.steps.direct.status).toBe("pending");
  expect(redone.steps.build.status).toBe("pending");
});
