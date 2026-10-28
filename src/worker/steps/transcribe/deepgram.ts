import { createReadStream } from "node:fs";
import { DeepgramClient } from "@deepgram/sdk";
import { z } from "zod";
import { DEEPGRAM_USD_PER_MIN } from "../../../lib/pricing";
import type { Transcript } from "../../../video/schema/transcript";
import type { Transcriber } from "./types";

const deepgramResponse = z.object({
  results: z.object({
    channels: z
      .array(
        z.object({
          detected_language: z.string().optional(),
          alternatives: z
            .array(
              z.object({
                transcript: z.string(),
                words: z.array(
                  z.object({
                    word: z.string(),
                    punctuated_word: z.string().optional(),
                    start: z.number(),
                    end: z.number(),
                    speaker: z.number().optional(),
                  }),
                ),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
});

const toMs = (seconds: number) => Math.round(seconds * 1000);

export function normalizeDeepgram(res: unknown): Transcript {
  const channel = deepgramResponse.parse(res).results.channels[0];
  const alternative = channel?.alternatives[0];
  if (!channel || !alternative)
    throw new Error("Deepgram response has no transcript");
  return {
    language: channel.detected_language ?? "unknown",
    text: alternative.transcript,
    words: alternative.words.map((word) => ({
      text: word.punctuated_word ?? word.word,
      startMs: toMs(word.start),
      endMs: toMs(word.end),
      ...(word.speaker === undefined ? {} : { speaker: String(word.speaker) }),
    })),
  };
}

export function deepgramTranscriber(apiKey: string): Transcriber {
  const client = new DeepgramClient({ apiKey });
  return {
    name: "deepgram",
    async transcribe(audioPath, durationMs) {
      const response = await client.listen.v1.media.transcribeFile(
        createReadStream(audioPath),
        {
          model: "nova-3",
          smart_format: true,
          diarize: true,
          detect_language: true,
        },
      );
      return {
        transcript: normalizeDeepgram(response),
        usd: (durationMs / 60000) * DEEPGRAM_USD_PER_MIN,
      };
    },
  };
}
