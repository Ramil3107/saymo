import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import { ELEVENLABS_STT_USD_PER_MIN } from "../../../lib/pricing";
import type { Transcript } from "../../../video/schema/transcript";
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

const toMs = (seconds: number) => Math.round(seconds * 1000);

export function normalizeElevenLabs(res: ElevenLabsSttResponse): Transcript {
  return {
    language: res.language_code,
    text: res.text,
    words: res.words
      .filter((word) => word.type === "word")
      .map((word) => ({
        text: word.text,
        startMs: toMs(word.start),
        endMs: toMs(word.end),
        ...(word.speaker_id ? { speaker: word.speaker_id } : {}),
      })),
  };
}

export function elevenLabsTranscriber(apiKey: string): Transcriber {
  return {
    name: "elevenlabs",
    async transcribe(audioPath, durationMs) {
      const form = new FormData();
      form.append(
        "file",
        new Blob([await readFile(audioPath)]),
        basename(audioPath),
      );
      form.append("model_id", "scribe_v2");
      form.append("timestamps_granularity", "word");
      form.append("diarize", "true");
      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: form,
        },
      );
      if (!response.ok)
        throw new Error(
          `ElevenLabs speech-to-text failed: ${response.status} ${await response.text()}`,
        );
      const transcript = normalizeElevenLabs(
        ElevenLabsSttResponseSchema.parse(await response.json()),
      );
      return {
        transcript,
        usd: (durationMs / 60000) * ELEVENLABS_STT_USD_PER_MIN,
      };
    },
  };
}
