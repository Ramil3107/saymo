import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type { MediaInfo } from "../video/schema/media";

const execFileAsync = promisify(execFile);
const maxBuffer = 64 * 1024 * 1024;
const stderrTailChars = 2000;

export class IngestError extends Error {}

type Output = { stdout: string; stderr: string };

async function run(
  binary: "ffmpeg" | "ffprobe",
  args: string[],
): Promise<Output> {
  try {
    return await execFileAsync(binary, args, { maxBuffer });
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & Partial<Output>;
    if (failure.code === "ENOENT")
      throw new IngestError("ffmpeg is not installed");
    throw new IngestError(
      (failure.stderr ?? failure.message).slice(-stderrTailChars),
    );
  }
}

export function runFfmpeg(args: string[]): Promise<Output> {
  return run("ffmpeg", args);
}

const probeOutput = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      r_frame_rate: z.string().optional(),
    }),
  ),
  format: z.object({ duration: z.string(), size: z.string() }),
});

function parseFrameRate(ratio: string | undefined): number {
  const [numerator, denominator = "1"] = (ratio ?? "0").split("/");
  const fps = Number(numerator) / Number(denominator);
  return Number.isFinite(fps) ? fps : 0;
}

export async function probe(file: string): Promise<MediaInfo> {
  const notVideo = new IngestError(`Not a video file: ${file}`);
  let output: Output;
  try {
    output = await run("ffprobe", [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      file,
    ]);
  } catch (error) {
    if (
      error instanceof IngestError &&
      error.message === "ffmpeg is not installed"
    )
      throw error;
    throw notVideo;
  }
  const parsed = probeOutput.safeParse(JSON.parse(output.stdout));
  const video = parsed.success
    ? parsed.data.streams.find((s) => s.codec_type === "video")
    : undefined;
  if (!parsed.success || !video) throw notVideo;
  return {
    durationMs: Math.round(Number(parsed.data.format.duration) * 1000),
    width: video.width ?? 0,
    height: video.height ?? 0,
    fps: parseFrameRate(video.r_frame_rate),
    hasAudio: parsed.data.streams.some((s) => s.codec_type === "audio"),
    sizeBytes: Number(parsed.data.format.size),
  };
}

export async function makeTestVideo(
  outPath: string,
  seconds: number,
): Promise<void> {
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=640x360:rate=30",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440",
    "-t",
    String(seconds),
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    outPath,
  ]);
}
