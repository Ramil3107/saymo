import { parseArgs } from "node:util";
import { runFfmpeg } from "../lib/ffmpeg";
import { frameChanges, isStill, stillNoiseLimit } from "../video/qa/stillness";

const usage = "Usage: pnpm check:still <video.mp4> --from <s> --to <s> [--crop w:h:x:y]";

await main();

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { from: { type: "string" }, to: { type: "string" }, crop: { type: "string" } },
  });
  const video = positionals[0];
  if (!video || !values.from || !values.to) throw new Error(usage);

  const changes = frameChanges(await measure(video, Number(values.from), Number(values.to), values.crop));
  const largest = Math.max(0, ...changes);
  console.log(
    `${changes.length} frame pairs, largest change ${largest} (compression noise is up to ${stillNoiseLimit})`,
  );
  if (!isStill(changes)) process.exitCode = 1;
}

async function measure(video: string, fromS: number, toS: number, crop: string | undefined): Promise<string> {
  const window = ["-ss", String(fromS), "-t", String(toS - fromS)];
  const filters = [crop ? `crop=${crop}` : "", "format=gray", "tblend=all_mode=difference", "signalstats"];
  const printing = "metadata=print:key=lavfi.signalstats.YMAX:file=-";
  const graph = [...filters.filter((filter) => filter !== ""), printing].join(",");

  const { stdout } = await runFfmpeg([
    "-v",
    "error",
    ...window,
    "-i",
    video,
    "-vf",
    graph,
    "-f",
    "null",
    "-",
  ]);
  return stdout;
}
