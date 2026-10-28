import type { Transcript } from "../../../video/schema/transcript";

export type Transcription = { transcript: Transcript; usd: number };

export interface Transcriber {
  name: "elevenlabs" | "deepgram";
  transcribe(audioPath: string, durationMs: number): Promise<Transcription>;
}
