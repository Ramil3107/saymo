import { type DestinationId, destinations } from "../../../video/destinations";
import { registers } from "../../../video/registers";
import type { ContentMap, FaceBox, FrameNote, Shot } from "../../../video/schema/content";
import type { Transcript, TranscriptWord } from "../../../video/schema/transcript";
import { styles } from "../../../video/styles";

export type DirectorInput = {
  mode: "footage" | "text";
  destination: DestinationId;
  content?: ContentMap;
  text?: string;
  pageText?: string;
  brand?: { colors: string[]; font: string };
};

type Line = { startMs: number; text: string; speaker?: string };

const sentenceGapMs = 1200;

const rules = [
  "- beats are contiguous from 0 and their durationMs add up exactly to lengthMs; lengthMs never exceeds the destination's max length nor the source length in footage mode.",
  "- overlay atMs is relative to its beat; footage ranges fromMs and toMs are positions in the source video and toMs minus fromMs equals the beat's durationMs.",
  "- the first second never shows an empty frame; no more than the register's max elements per beat; no more than 6 words on screen at once.",
  "- copy is written in the language of the speech or of the request.",
  "- when the transcript is empty, cut by the shots and the frame notes, keep captions disabled and say so in assumptions.",
  "- questions only about what changes the result and cannot be guessed (whose name to show, which product is the main one, which of several strong moments to cut); at most three; each with two to four options and a default. Everything else you decide and list under assumptions.",
  "- voiceover true only in text mode and only for narrative genres; in footage mode the footage's own speech is the voice.",
  "- style is the one of the styles that fits the brand, the content and the register; captions.style, every beat's transition and every title entrance come from that style's lists.",
  "- title lines are short, one or two words each and three lines at most, so the title can be set large; a longer thought goes to a headline or to the captions.",
  "- a beat's transition is how it enters: cut inside a continuous talk; the style's other transitions at section changes and reveals, two to five per minute, never on every beat.",
  "- return only the plan object that matches the schema.",
];

export function directorSystemPrompt(): string {
  return [
    "You are the director of a short social video. You turn the owner's footage or text into a plan of beats that a deterministic builder assembles into a video. You never write code and never invent facts that are not in the input.",
    "",
    "Three entry modes: footage with motion graphics (the main one), text only (a video made entirely of graphics), and minimal (captions, cuts and zooms). Choose the mode from what you are given and from the destination; do not ask about it.",
    "",
    "Vocabulary of overlays (kind: fields): headline (text, optional sub), chip (text of one to three words, optional badge of two or three characters such as Fe, B12 or 01), big-number (text is the number, sub is its label), lower-third (text is the name, sub is the role), quote (text, sub is the author), sticker (text), title-card (text is a title of two to five words, sub is a short section label such as '02 · Як перевіритись'), list (text is the title, items are two to six entries of one to four words), title (the kinetic headline of graphics beats: lines are one to three lines, each with text, size xl, l, m or s, tone ink, accent or alt, align left, center or right, and marked for a marker sweep under it; entrance comes from the style's title entrances), counter (value is the number, prefix and suffix such as - and %, sub is a short label; for one striking number), corner-label (text of one to three words, a small label in a corner, mostly in bold-pop). Layouts per beat: free (the default, chips float beside the subject), panel-top (a dark panel over the top of the frame holding a title-card, the subject moves down), panel-side (a dark panel over one side holding a list, the subject moves to the other side). Use panel layouts for section openers and enumerations, two to five per minute, never two beats in a row. Camera per beat: none, push, punch-in or pan with intensity 0 to 1. Captions styles, picked by the register and the content: rail (the default: a short phrase whose words appear as they are said, keywords in the accent color), keyword-box (three words in heavy capitals, words pop in as they are said, keywords in an accent box; creator and sale videos), bold-center (one or two huge words at a time in the middle of the frame; hooks and launches), pop (three words in capitals, the spoken word grows), karaoke (a line, the spoken word in the accent color), karaoke-pill (a line, an accent capsule under the spoken word), box (a line on a dark rounded pill; quiet and accessible), minimal (one lowercase line in a light weight; lifestyle and education), weight-shift (words thicken from light to heavy as they are said), marker (keywords get a marker sweep), typewriter (a line typed on a white pill), editorial (a serif line with keywords in italic; premium), outline (outlined capitals that fill as they are said). captions.keywords lists 15 to 40 words from the speech that deserve the accent color, spelled exactly as spoken; an empty list when there is no speech.",
    "",
    "Destinations:",
    destinationTable(),
    "",
    "Registers:",
    registerTable(),
    "",
    "Styles (the look of the whole video):",
    styleTable(),
    "",
    "Rules:",
    ...rules,
  ].join("\n");
}

export function directorUserMessage(input: DirectorInput): string {
  const destination = destinations[input.destination];
  const parts = [
    `Destination: ${input.destination} (format ${destination.format}, max length ${destination.maxLengthMs} ms).`,
    brandLine(input.brand),
  ];

  if (input.mode === "footage" && input.content) parts.push(contentSection(input.content));
  if (input.text) parts.push(`Request:\n${input.text}`);
  if (input.pageText) parts.push(`Page text:\n${input.pageText}`);
  parts.push("Write the plan.");

  return parts.join("\n\n");
}

function destinationTable(): string {
  return Object.entries(destinations)
    .map(([id, d]) => {
      const safeZone = `top ${d.safeZone.top} bottom ${d.safeZone.bottom} left ${d.safeZone.left} right ${d.safeZone.right}`;
      return `${id}: format ${d.format}, max length ${d.maxLengthMs} ms, safe zone ${safeZone}, captions by default ${d.captionsDefault}`;
    })
    .join("\n");
}

function styleTable(): string {
  return Object.entries(styles)
    .map(([id, style]) => {
      const lists = `captions ${style.captions.join(", ")}; transitions ${style.transitions.join(", ")}; title entrances ${style.titleEntrances.join(", ")}`;
      return `${id}: ${style.summary} Uses ${lists}.`;
    })
    .join("\n");
}

function registerTable(): string {
  return Object.entries(registers)
    .map(([id, r]) => {
      const scene = `scene ${r.sceneMs[0]}–${r.sceneMs[1]} ms, min hold ${r.minHoldMs} ms`;
      const look = `font weight ${r.fontWeight[0]}–${r.fontWeight[1]}, max ${r.maxElements} elements per beat`;
      return `${id}: ${scene}, ${look}, music ${r.musicBpm[0]}–${r.musicBpm[1]} bpm`;
    })
    .join("\n");
}

function brandLine(brand: DirectorInput["brand"]): string {
  if (!brand) return "Brand: none, use a neutral style.";
  return `Brand: colors ${brand.colors.join(", ")}, font ${brand.font}.`;
}

function contentSection(content: ContentMap): string {
  const { source } = content;

  return [
    `Source: ${source.durationMs} ms, ${source.width}×${source.height}, ${source.fps} fps.`,
    `Shots:\n${shotLines(content.shots)}`,
    `Frames:\n${frameLines(content.frames)}`,
    facesSummary(content.faces),
    transcriptSection(content.transcript),
  ].join("\n\n");
}

function shotLines(shots: Shot[]): string {
  return shots.map((shot) => `shot ${shot.index}: ${shot.startMs}–${shot.endMs} ms`).join("\n");
}

function frameLines(frames: FrameNote[]): string {
  return frames
    .map((frame) => {
      const text = frame.onScreenText.length ? ` On-screen text: ${frame.onScreenText.join(" | ")}` : "";
      return `${frame.tMs} ms, ${frame.kind}: ${frame.description}${text}`;
    })
    .join("\n");
}

function facesSummary(faces: FaceBox[]): string {
  const first = faces[0];
  if (!first) return "No faces detected.";

  const times = faces.map((face) => face.tMs);
  const side = first.x + first.w / 2 < 0.5 ? "left" : "right";

  return `A person is in frame from ${Math.min(...times)} ms to ${Math.max(...times)} ms, mostly on the ${side} side.`;
}

function transcriptSection(transcript: Transcript | null): string {
  if (!transcript || transcript.words.length === 0) return "Transcript: there is no speech in this video.";

  const lines = sentences(transcript.words).map(
    (line) => `[${timecode(line.startMs)}]${line.speaker ? ` ${line.speaker}:` : ""} ${line.text}`,
  );

  return `Transcript (language ${transcript.language}):\n${lines.join("\n")}`;
}

function sentences(words: TranscriptWord[]): Line[] {
  const lines: Line[] = [];
  let current: TranscriptWord[] = [];

  const flush = () => {
    const line = lineOf(current);
    if (line) lines.push(line);
    current = [];
  };

  for (const word of words) {
    const previous = current.at(-1);
    if (previous && startsNewSentence(previous, word)) flush();
    current.push(word);
    if (/[.!?]$/.test(word.text)) flush();
  }
  flush();

  return lines;
}

function startsNewSentence(previous: TranscriptWord, word: TranscriptWord): boolean {
  return word.startMs - previous.endMs > sentenceGapMs || word.speaker !== previous.speaker;
}

function lineOf(words: TranscriptWord[]): Line | undefined {
  const first = words[0];
  if (!first) return undefined;

  return {
    startMs: first.startMs,
    text: words.map((word) => word.text).join(" "),
    ...(first.speaker ? { speaker: first.speaker } : {}),
  };
}

function timecode(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds - minutes * 60).toFixed(1).padStart(4, "0");

  return `${minutes}:${seconds}`;
}
