import { type DestinationId, destinations } from "../../../video/destinations";
import { registers } from "../../../video/registers";
import type { ContentMap } from "../../../video/schema/content";
import type {
  Transcript,
  TranscriptWord,
} from "../../../video/schema/transcript";

export type DirectorInput = {
  mode: "footage" | "text";
  destination: DestinationId;
  content?: ContentMap;
  text?: string;
  pageText?: string;
  brand?: { colors: string[]; font: string };
};

const sentenceGapMs = 1200;

const destinationTable = Object.entries(destinations)
  .map(
    ([id, d]) =>
      `${id}: format ${d.format}, max length ${d.maxLengthMs} ms, safe zone top ${d.safeZone.top} bottom ${d.safeZone.bottom} left ${d.safeZone.left} right ${d.safeZone.right}, captions by default ${d.captionsDefault}`,
  )
  .join("\n");

const registerTable = Object.entries(registers)
  .map(
    ([id, r]) =>
      `${id}: scene ${r.sceneMs[0]}–${r.sceneMs[1]} ms, min hold ${r.minHoldMs} ms, easing ${r.easing}, font weight ${r.fontWeight[0]}–${r.fontWeight[1]}, max ${r.maxElements} elements per beat, music ${r.musicBpm[0]}–${r.musicBpm[1]} bpm`,
  )
  .join("\n");

export function directorSystemPrompt(): string {
  return [
    "You are the director of a short social video. You turn the owner's footage or text into a plan of beats that a deterministic builder assembles into a video. You never write code and never invent facts that are not in the input.",
    "",
    "Three entry modes: footage with motion graphics (the main one), text only (a video made entirely of graphics), and minimal (captions, cuts and zooms). Choose the mode from what you are given and from the destination; do not ask about it.",
    "",
    "Vocabulary of overlays (kind: fields): headline (text, optional sub), chip (text), big-number (text is the number, sub is its label), lower-third (text is the name, sub is the role), quote (text, sub is the author), sticker (text). Camera per beat: none, push, punch-in or pan with intensity 0 to 1. Captions styles: karaoke, box, pop.",
    "",
    "Destinations:",
    destinationTable,
    "",
    "Registers:",
    registerTable,
    "",
    "Rules:",
    "- beats are contiguous from 0 and their durationMs add up exactly to lengthMs; lengthMs never exceeds the destination's max length nor the source length in footage mode.",
    "- overlay atMs is relative to its beat; footage ranges fromMs and toMs are positions in the source video and toMs minus fromMs equals the beat's durationMs.",
    "- the first second never shows an empty frame; no more than the register's max elements per beat; no more than 6 words on screen at once.",
    "- copy is written in the language of the speech or of the request.",
    "- when the transcript is empty, cut by the shots and the frame notes, keep captions disabled and say so in assumptions.",
    "- questions only about what changes the result and cannot be guessed (whose name to show, which product is the main one, which of several strong moments to cut); at most three; each with two to four options and a default. Everything else you decide and list under assumptions.",
    "- voiceover true only in text mode and only for narrative genres; in footage mode the footage's own speech is the voice.",
    "- return only the plan object that matches the schema.",
  ].join("\n");
}

function timecode(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds - minutes * 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds}`;
}

function sentences(
  words: TranscriptWord[],
): { startMs: number; text: string; speaker?: string }[] {
  const lines: { startMs: number; text: string; speaker?: string }[] = [];
  let current: TranscriptWord[] = [];
  const flush = () => {
    const first = current[0];
    if (!first) return;
    lines.push({
      startMs: first.startMs,
      text: current.map((w) => w.text).join(" "),
      ...(first.speaker ? { speaker: first.speaker } : {}),
    });
    current = [];
  };
  for (const word of words) {
    const previous = current.at(-1);
    if (
      previous &&
      (word.startMs - previous.endMs > sentenceGapMs ||
        word.speaker !== previous.speaker)
    )
      flush();
    current.push(word);
    if (/[.!?]$/.test(word.text)) flush();
  }
  flush();
  return lines;
}

function transcriptSection(transcript: Transcript | null): string {
  if (!transcript || transcript.words.length === 0)
    return "Transcript: there is no speech in this video.";
  const lines = sentences(transcript.words).map(
    (line) =>
      `[${timecode(line.startMs)}]${line.speaker ? ` ${line.speaker}:` : ""} ${line.text}`,
  );
  return `Transcript (language ${transcript.language}):\n${lines.join("\n")}`;
}

function contentSection(content: ContentMap): string {
  const shots = content.shots
    .map((s) => `shot ${s.index}: ${s.startMs}–${s.endMs} ms`)
    .join("\n");
  const frames = content.frames
    .map(
      (f) =>
        `${f.tMs} ms, ${f.kind}: ${f.description}${f.onScreenText.length ? ` On-screen text: ${f.onScreenText.join(" | ")}` : ""}`,
    )
    .join("\n");
  const faceTimes = content.faces.map((f) => f.tMs);
  const faces =
    faceTimes.length === 0
      ? "No faces detected."
      : `A person is in frame from ${Math.min(...faceTimes)} ms to ${Math.max(...faceTimes)} ms, mostly on the ${content.faces[0] && content.faces[0].x + content.faces[0].w / 2 < 0.5 ? "left" : "right"} side.`;
  return [
    `Source: ${content.source.durationMs} ms, ${content.source.width}×${content.source.height}, ${content.source.fps} fps.`,
    `Shots:\n${shots}`,
    `Frames:\n${frames}`,
    faces,
    transcriptSection(content.transcript),
  ].join("\n\n");
}

export function directorUserMessage(input: DirectorInput): string {
  const destination = destinations[input.destination];
  const parts = [
    `Destination: ${input.destination} (format ${destination.format}, max length ${destination.maxLengthMs} ms).`,
    input.brand
      ? `Brand: colors ${input.brand.colors.join(", ")}, font ${input.brand.font}.`
      : "Brand: none, use a neutral style.",
  ];
  if (input.mode === "footage" && input.content)
    parts.push(contentSection(input.content));
  if (input.text) parts.push(`Request:\n${input.text}`);
  if (input.pageText) parts.push(`Page text:\n${input.pageText}`);
  parts.push("Write the plan.");
  return parts.join("\n\n");
}
