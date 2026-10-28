import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type { MediaInfo } from "../video/schema/media";

const execFileAsync = promisify(execFile);

const maxOutputBytes = 64 * 1024 * 1024;
const errorTailChars = 2000;

type Binary = "ffmpeg" | "ffprobe";
type Output = { stdout: string; stderr: string };

export class IngestError extends Error {}

export function runFfmpeg(args: string[]): Promise<Output> {
  return run("ffmpeg", args);
}

export async function probe(file: string): Promise<MediaInfo> {
  const output = await probeJson(file, ["-show_streams", "-show_format"]);
  const parsed = probeOutputSchema.safeParse(output);
  const video = parsed.success
    ? parsed.data.streams.find((stream) => stream.codec_type === "video")
    : undefined;

  if (!parsed.success || !video) throw new IngestError(`Not a video file: ${file}`);

  return {
    durationMs: secondsToMs(parsed.data.format.duration),
    width: video.width ?? 0,
    height: video.height ?? 0,
    fps: parseFrameRate(video.r_frame_rate),
    hasAudio: parsed.data.streams.some((stream) => stream.codec_type === "audio"),
    sizeBytes: Number(parsed.data.format.size),
  };
}

export async function probeDuration(file: string): Promise<number> {
  const output = await probeJson(file, ["-show_format"]);
  const parsed = durationOutputSchema.safeParse(output);

  if (!parsed.success) throw new IngestError(`No duration in ${file}`);

  return secondsToMs(parsed.data.format.duration);
}

export async function makeTestVideo(
  outPath: string,
  seconds: number,
  options: { audio?: boolean } = {},
): Promise<void> {
  const withAudio = options.audio ?? true;
  const videoSource = ["-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30"];
  const audioSource = withAudio ? ["-f", "lavfi", "-i", "sine=frequency=440"] : [];
  const encoding = ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p"];
  const audioEncoding = withAudio ? ["-c:a", "aac"] : ["-an"];

  await runFfmpeg([
    "-y",
    ...videoSource,
    ...audioSource,
    "-t",
    String(seconds),
    ...encoding,
    ...audioEncoding,
    outPath,
  ]);
}

const probeOutputSchema = z.object({
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

const durationOutputSchema = z.object({ format: z.object({ duration: z.string() }) });

async function probeJson(file: string, sections: string[]): Promise<unknown> {
  try {
    const { stdout } = await run("ffprobe", ["-v", "error", "-print_format", "json", ...sections, file]);
    return JSON.parse(stdout);
  } catch (error) {
    if (isMissingBinary(error)) throw error;
    throw new IngestError(`Not a video file: ${file}`);
  }
}

async function run(binary: Binary, args: string[]): Promise<Output> {
  try {
    return await execFileAsync(binary, args, { maxBuffer: maxOutputBytes });
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & Partial<Output>;
    if (failure.code === "ENOENT") throw new IngestError("ffmpeg is not installed");
    throw new IngestError((failure.stderr ?? failure.message).slice(-errorTailChars));
  }
}

function isMissingBinary(error: unknown): boolean {
  return error instanceof IngestError && error.message === "ffmpeg is not installed";
}

function secondsToMs(seconds: string): number {
  return Math.round(Number(seconds) * 1000);
}

function parseFrameRate(ratio: string | undefined): number {
  const [numerator, denominator = "1"] = (ratio ?? "0").split("/");
  const fps = Number(numerator) / Number(denominator);
  return Number.isFinite(fps) ? fps : 0;
}
