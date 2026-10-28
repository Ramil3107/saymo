import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { probeDuration } from "../../../lib/ffmpeg";
import type { Metrics } from "../../../lib/metrics";
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

const toMs = (seconds: number) => Math.round(seconds * 1000);

export function wordsFromAlignment(alignment: Alignment): TranscriptWord[] {
  const words: TranscriptWord[] = [];
  let current: { text: string; startMs: number; endMs: number } | undefined;
  alignment.characters.forEach((char, i) => {
    const startMs = toMs(alignment.character_start_times_seconds[i] ?? 0);
    const endMs = toMs(alignment.character_end_times_seconds[i] ?? 0);
    if (/\s/.test(char)) {
      if (current) words.push(current);
      current = undefined;
      return;
    }
    current = current
      ? { ...current, text: current.text + char, endMs }
      : { text: char, startMs, endMs };
  });
  if (current) words.push(current);
  return words;
}

export async function synthesizeVoice(input: {
  apiKey: string;
  voiceId: string;
  text: string;
  outPath: string;
  metrics: Metrics;
}): Promise<{ path: string; durationMs: number; words: TranscriptWord[] }> {
  const startedAt = performance.now();
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${input.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": input.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: input.text,
        model_id: "eleven_multilingual_v2",
      }),
    },
  );
  if (!response.ok)
    throw new Error(
      `ElevenLabs text-to-speech failed: ${response.status} ${await response.text()}`,
    );
  const body = ElevenLabsTtsResponseSchema.parse(await response.json());
  await mkdir(dirname(input.outPath), { recursive: true });
  await writeFile(input.outPath, Buffer.from(body.audio_base64, "base64"));
  const durationMs = await probeDuration(input.outPath);
  input.metrics.record({
    step: "voice",
    provider: "elevenlabs",
    ms: Math.round(performance.now() - startedAt),
    usd: (input.text.length / 1000) * ELEVENLABS_TTS_USD_PER_1K_CHARS,
    detail: { chars: input.text.length },
  });
  return {
    path: input.outPath,
    durationMs,
    words: body.alignment ? wordsFromAlignment(body.alignment) : [],
  };
}
