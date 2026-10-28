import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import { ELEVENLABS_STT_USD_PER_MIN } from "../../../lib/pricing";
import type { Transcript, TranscriptWord } from "../../../video/schema/transcript";
import type { Transcriber } from "./types";

export const ElevenLabsSttResponseSchema = z.object({
  language_code: z.string(),
  text: z.string(),
  words: z.array(
    z.object({
      text: z.string(),
      start: z.number(),
      end: z.number(),
      type: z.enum(["word", "spacing", "audio_event"]),
      speaker_id: z.string().optional(),
    }),
  ),
});

export type ElevenLabsSttResponse = z.infer<typeof ElevenLabsSttResponseSchema>;

type ElevenLabsWord = ElevenLabsSttResponse["words"][number];

const endpoint = "https://api.elevenlabs.io/v1/speech-to-text";
const modelId = "scribe_v2";

export function elevenLabsTranscriber(apiKey: string): Transcriber {
  return {
    name: "elevenlabs",
    async transcribe(audioPath, durationMs) {
      const response = await requestTranscript(apiKey, audioPath);
      const transcript = normalizeElevenLabs(ElevenLabsSttResponseSchema.parse(response));

      return { transcript, usd: (durationMs / 60_000) * ELEVENLABS_STT_USD_PER_MIN };
    },
  };
}

export function normalizeElevenLabs(response: ElevenLabsSttResponse): Transcript {
  return {
    language: response.language_code,
    text: response.text,
    words: response.words.filter((word) => word.type === "word").map(toWord),
  };
}

async function requestTranscript(apiKey: string, audioPath: string): Promise<unknown> {
  const form = new FormData();
  form.append("file", new Blob([await readFile(audioPath)]), basename(audioPath));
  form.append("model_id", modelId);
  form.append("timestamps_granularity", "word");
  form.append("diarize", "true");

  const response = await fetch(endpoint, { method: "POST", headers: { "xi-api-key": apiKey }, body: form });
  if (!response.ok) {
    throw new Error(`ElevenLabs speech-to-text failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function toWord(word: ElevenLabsWord): TranscriptWord {
  return {
    text: word.text,
    startMs: toMs(word.start),
    endMs: toMs(word.end),
    ...(word.speaker_id ? { speaker: word.speaker_id } : {}),
  };
}

function toMs(seconds: number): number {
  return Math.round(seconds * 1000);
}
