import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import textPlan from "../../../../../fixtures/plan.text.json" with { type: "json" };
import { directLocally, WaitingForPlanError } from "../localDirector";
import type { DirectorInput } from "../prompts";

const input: DirectorInput = { mode: "text", destination: "reels", text: "Reports now export to PDF" };

function briefFolder(): string {
  return join(mkdtempSync(join(tmpdir(), "saymo-director-")), "director");
}

test("directLocally writes the prompt and the schema, then waits for a plan", async () => {
  const folder = briefFolder();

  await expect(directLocally(input, folder)).rejects.toBeInstanceOf(WaitingForPlanError);
  expect(readFileSync(join(folder, "prompt.md"), "utf8")).toContain("Reports now export to PDF");
  expect(JSON.parse(readFileSync(join(folder, "schema.json"), "utf8")).type).toBe("object");
});

test("directLocally returns the plan written for it", async () => {
  const folder = briefFolder();
  await directLocally(input, folder).catch(() => undefined);
  writeFileSync(join(folder, "plan.json"), JSON.stringify(textPlan));

  const plan = await directLocally(input, folder);
  expect(plan.beats.length).toBe(textPlan.beats.length);
});

test("directLocally keeps waiting and names the problem when the plan is invalid", async () => {
  const folder = briefFolder();
  await directLocally(input, folder).catch(() => undefined);

  writeFileSync(
    join(folder, "plan.json"),
    JSON.stringify({ ...textPlan, lengthMs: textPlan.lengthMs + 5000 }),
  );
  await expect(directLocally(input, folder)).rejects.toThrow(/lengthMs/);

  writeFileSync(join(folder, "plan.json"), "{ not json");
  await expect(directLocally(input, folder)).rejects.toBeInstanceOf(WaitingForPlanError);
});
