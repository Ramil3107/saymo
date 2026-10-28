import type { Transcript } from "../../../video/schema/transcript";

export interface Transcriber {
  name: "elevenlabs" | "deepgram";
  transcribe(
    audioPath: string,
    durationMs: number,
  ): Promise<{ transcript: Transcript; usd: number }>;
}
