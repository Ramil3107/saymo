import { createReadStream } from "node:fs";
import { DeepgramClient } from "@deepgram/sdk";
import { z } from "zod";
import { DEEPGRAM_USD_PER_MIN } from "../../../lib/pricing";
import type { Transcript, TranscriptWord } from "../../../video/schema/transcript";
import type { Transcriber } from "./types";

const DeepgramWordSchema = z.object({
  word: z.string(),
  punctuated_word: z.string().optional(),
  start: z.number(),
  end: z.number(),
  speaker: z.number().optional(),
});

const DeepgramResponseSchema = z.object({
  results: z.object({
    channels: z
      .array(
        z.object({
          detected_language: z.string().optional(),
          alternatives: z
            .array(z.object({ transcript: z.string(), words: z.array(DeepgramWordSchema) }))
            .min(1),
        }),
      )
      .min(1),
  }),
});

type DeepgramWord = z.infer<typeof DeepgramWordSchema>;

const model = "nova-3";

export function deepgramTranscriber(apiKey: string): Transcriber {
  const client = new DeepgramClient({ apiKey });

  return {
    name: "deepgram",
    async transcribe(audioPath, durationMs) {
      const response = await client.listen.v1.media.transcribeFile(createReadStream(audioPath), {
        model,
        smart_format: true,
        diarize: true,
        detect_language: true,
      });

      return { transcript: normalizeDeepgram(response), usd: (durationMs / 60_000) * DEEPGRAM_USD_PER_MIN };
    },
  };
}

export function normalizeDeepgram(response: unknown): Transcript {
  const channel = DeepgramResponseSchema.parse(response).results.channels[0];
  const alternative = channel?.alternatives[0];
  if (!channel || !alternative) throw new Error("Deepgram response has no transcript");

  return {
    language: channel.detected_language ?? "unknown",
    text: alternative.transcript,
    words: alternative.words.map(toWord),
  };
}

function toWord(word: DeepgramWord): TranscriptWord {
  return {
    text: word.punctuated_word ?? word.word,
    startMs: toMs(word.start),
    endMs: toMs(word.end),
    ...(word.speaker === undefined ? {} : { speaker: String(word.speaker) }),
  };
}

function toMs(seconds: number): number {
  return Math.round(seconds * 1000);
}
