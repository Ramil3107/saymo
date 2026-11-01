import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { readJson, writeJson } from "../lib/json";
import { defaultBrand } from "../video/brand";
import { runQa } from "../video/qa/checks";
import { renderLocal } from "../video/render/renderLocal";
import { type Plan, PlanSchema } from "../video/schema/plan";
import { type StyleId, StyleIdSchema, styles } from "../video/styles";
import { buildVideo } from "../worker/steps/build/buildVideo";

const usage =
  "Usage: pnpm render:plan <plan.json> --out <dir> [--style bold-pop|clean-paper] [--colors #hex,#hex]";

await main();

// Builds a text-mode plan written by hand or by the local director, checks it and renders it, with no API calls.
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { out: { type: "string" }, style: { type: "string" }, colors: { type: "string" } },
  });
  const planPath = positionals[0];
  if (!planPath || !values.out) throw new Error(usage);

  const plan = await readJson(planPath, PlanSchema);
  const styled = values.style ? restyled(plan, StyleIdSchema.parse(values.style)) : plan;
  const brand = values.colors ? { ...defaultBrand, colors: values.colors.split(",") } : undefined;
  const doc = buildVideo(styled, null, {}, brand);
  const qa = runQa(doc, styled, {}, null);

  await mkdir(values.out, { recursive: true });
  await writeJson(join(values.out, "video.json"), doc);
  await writeJson(join(values.out, "qa.json"), qa);
  const { ms } = await renderLocal(doc, join(values.out, "out.mp4"));
  console.log(
    `${doc.style}: ${doc.scenes.length} scenes, ${qa.issues.length} QA issues, rendered in ${ms} ms to ${values.out}`,
  );
}

// Moves a plan to another style: transitions the style does not use become the style's own, in order.
function restyled(plan: Plan, style: StyleId): Plan {
  const own = styles[style].transitions;
  const beats = plan.beats.map((beat, index) => {
    const transition =
      beat.transition && !own.includes(beat.transition) ? own[index % own.length] : beat.transition;
    return { ...beat, transition };
  });

  return { ...plan, style, beats };
}
