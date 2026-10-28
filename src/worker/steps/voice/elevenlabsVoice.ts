import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { probeDuration } from "../../../lib/ffmpeg";
import { elapsedMs, type Metrics } from "../../../lib/metrics";
import { ELEVENLABS_TTS_USD_PER_1K_CHARS } from "../../../lib/pricing";
import type { TranscriptWord } from "../../../video/schema/transcript";

const AlignmentSchema = z.object({
  characters: z.array(z.string()),
  character_start_times_seconds: z.array(z.number()),
  character_end_times_seconds: z.array(z.number()),
});

type Alignment = z.infer<typeof AlignmentSchema>;

export const ElevenLabsTtsResponseSchema = z.object({
  audio_base64: z.string(),
  alignment: AlignmentSchema.nullable().optional(),
});

type SynthesizeInput = {
  apiKey: string;
  voiceId: string;
  text: string;
  outPath: string;
  metrics: Metrics;
};

type SynthesizedVoice = { path: string; durationMs: number; words: TranscriptWord[] };

const modelId = "eleven_multilingual_v2";
const outputFormat = "mp3_44100_128";

export async function synthesizeVoice(input: SynthesizeInput): Promise<SynthesizedVoice> {
  const startedAt = performance.now();
  const body = ElevenLabsTtsResponseSchema.parse(await requestSpeech(input));

  await mkdir(dirname(input.outPath), { recursive: true });
  await writeFile(input.outPath, Buffer.from(body.audio_base64, "base64"));
  const durationMs = await probeDuration(input.outPath);

  input.metrics.record({
    step: "voice",
    provider: "elevenlabs",
    ms: elapsedMs(startedAt),
    usd: (input.text.length / 1000) * ELEVENLABS_TTS_USD_PER_1K_CHARS,
    detail: { chars: input.text.length },
  });

  return { path: input.outPath, durationMs, words: body.alignment ? wordsFromAlignment(body.alignment) : [] };
}

export function wordsFromAlignment(alignment: Alignment): TranscriptWord[] {
  const words: TranscriptWord[] = [];
  let current: TranscriptWord | undefined;

  alignment.characters.forEach((char, index) => {
    const startMs = toMs(alignment.character_start_times_seconds[index] ?? 0);
    const endMs = toMs(alignment.character_end_times_seconds[index] ?? 0);

    if (/\s/.test(char)) {
      if (current) words.push(current);
      current = undefined;
      return;
    }
    current = current ? { ...current, text: current.text + char, endMs } : { text: char, startMs, endMs };
  });
  if (current) words.push(current);

  return words;
}

async function requestSpeech(input: SynthesizeInput): Promise<unknown> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${input.voiceId}/with-timestamps?output_format=${outputFormat}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": input.apiKey, "content-type": "application/json" },
    body: JSON.stringify({ text: input.text, model_id: modelId }),
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs text-to-speech failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function toMs(seconds: number): number {
  return Math.round(seconds * 1000);
}
