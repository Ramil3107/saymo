import { join } from "node:path";
import { speechIntervals } from "../../../video/audio/ducking";
import { captionPages } from "../../../video/captions/pages";
import { rebaseWords } from "../../../video/captions/timeline";
import { destinations, formatSize } from "../../../video/destinations";
import { avoidZones } from "../../../video/layout/avoidZones";
import { fitCover } from "../../../video/layout/fitCover";
import { captionBand, placeOverlay } from "../../../video/layout/safeZones";
import type { Box, ContentMap } from "../../../video/schema/content";
import type { MediaInfo } from "../../../video/schema/media";
import type { Beat, Overlay, Plan } from "../../../video/schema/plan";
import type { TranscriptWord } from "../../../video/schema/transcript";
import {
  type Element,
  type Scene,
  type VideoDoc,
  VideoDocSchema,
} from "../../../video/schema/video";

export type BuildAssets = {
  sourceVideo?: { path: string; info: MediaInfo };
  music?: { path: string; durationMs: number };
  voice?: {
    beatId: string;
    path: string;
    durationMs: number;
    words: TranscriptWord[];
  }[];
};

type MusicManifest = {
  tracks: {
    file: string;
    title: string;
    mood: string;
    bpm: number;
    license: string;
    source: string;
    durationMs: number;
  }[];
};

const voicePaddingMs = 300;
const sourceAssetId = "source";
const musicAssetId = "music";

export function pickMusic(
  manifest: MusicManifest,
  mood: string,
): { path: string; durationMs: number } | undefined {
  const wanted = mood.toLowerCase();
  const track =
    manifest.tracks.find((t) => t.mood.toLowerCase() === wanted) ??
    manifest.tracks[0];
  return track
    ? {
        path: join("assets", "music", track.file),
        durationMs: track.durationMs,
      }
    : undefined;
}

function sceneDurations(plan: Plan, voice: BuildAssets["voice"]): number[] {
  const voiceByBeat = new Map((voice ?? []).map((v) => [v.beatId, v]));
  const required = plan.beats.map((beat) => {
    const v = voiceByBeat.get(beat.id);
    return v
      ? Math.max(beat.durationMs, v.durationMs + voicePaddingMs)
      : undefined;
  });
  const fixedSum = required.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  const flexibleSum = plan.beats.reduce(
    (sum, beat, i) => sum + (required[i] === undefined ? beat.durationMs : 0),
    0,
  );
  if (fixedSum > plan.lengthMs)
    throw new Error("Voiceover is longer than the plan");
  const factor =
    flexibleSum === 0 ? 1 : (plan.lengthMs - fixedSum) / flexibleSum;
  const durations = plan.beats.map(
    (beat, i) => required[i] ?? Math.round(beat.durationMs * factor),
  );
  const drift = plan.lengthMs - durations.reduce((sum, d) => sum + d, 0);
  const lastFlexible = required.lastIndexOf(undefined);
  const adjustAt = lastFlexible >= 0 ? lastFlexible : durations.length - 1;
  durations[adjustAt] = (durations[adjustAt] as number) + drift;
  return durations;
}

function elementFrom(
  beat: Beat,
  overlay: Overlay,
  box: Box,
  sceneDurationMs: number,
): Element {
  const base = {
    id: `${beat.id}-${overlay.id}`,
    enterMs: overlay.atMs,
    exitMs: Math.min(overlay.atMs + overlay.durationMs, sceneDurationMs),
    box,
    ...(overlay.emphasis ? { emphasis: overlay.emphasis } : {}),
  };
  switch (overlay.kind) {
    case "headline":
      return {
        ...base,
        kind: "headline",
        text: overlay.text,
        ...(overlay.sub ? { sub: overlay.sub } : {}),
      };
    case "chip":
      return { ...base, kind: "chip", text: overlay.text };
    case "big-number":
      return {
        ...base,
        kind: "big-number",
        value: overlay.text,
        ...(overlay.sub ? { label: overlay.sub } : {}),
      };
    case "lower-third":
      return {
        ...base,
        kind: "lower-third",
        name: overlay.text,
        ...(overlay.sub ? { role: overlay.sub } : {}),
      };
    case "quote":
      return {
        ...base,
        kind: "quote",
        text: overlay.text,
        ...(overlay.sub ? { author: overlay.sub } : {}),
      };
    case "sticker":
      return { ...base, kind: "sticker", text: overlay.text };
  }
}

function faceFocus(
  content: ContentMap | null,
  range: { fromMs: number; toMs: number },
): { x: number; y: number } | undefined {
  const faces =
    content?.faces.filter(
      (f) => f.tMs >= range.fromMs && f.tMs <= range.toMs,
    ) ?? [];
  if (faces.length === 0) return undefined;
  const centers = faces.map((f) => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 }));
  return {
    x: centers.reduce((sum, c) => sum + c.x, 0) / centers.length,
    y: centers.reduce((sum, c) => sum + c.y, 0) / centers.length,
  };
}

export function buildVideo(
  plan: Plan,
  content: ContentMap | null,
  assets: BuildAssets,
  brand: VideoDoc["brand"],
): VideoDoc {
  const destination = destinations[plan.destination];
  const target = formatSize(destination.format);
  const durations = sceneDurations(plan, assets.voice);
  const voiceByBeat = new Map((assets.voice ?? []).map((v) => [v.beatId, v]));
  const captionWords: TranscriptWord[] = [];
  const voice: VideoDoc["voice"] = [];
  let startMs = 0;
  const scenes: Scene[] = plan.beats.map((beat, index) => {
    const durationMs = durations[index] as number;
    const sceneStartMs = startMs;
    startMs += durationMs;
    const footageRange = beat.footage;
    const faceZones =
      footageRange && content
        ? avoidZones(content.faces, {
            startMs: footageRange.fromMs,
            endMs: footageRange.toMs,
          })
        : [];
    const avoid = plan.captions.enabled
      ? [...faceZones, captionBand(destination.safeZone)]
      : faceZones;
    const elements = beat.overlays.map((overlay) =>
      elementFrom(
        beat,
        overlay,
        placeOverlay(
          overlay.kind,
          destination.format,
          destination.safeZone,
          avoid,
        ),
        durationMs,
      ),
    );
    if (footageRange && content?.transcript)
      captionWords.push(
        ...rebaseWords(content.transcript.words, footageRange, sceneStartMs),
      );
    const spoken = voiceByBeat.get(beat.id);
    if (spoken) {
      voice.push({ assetId: `voice-${beat.id}`, atMs: sceneStartMs });
      captionWords.push(
        ...spoken.words.map((w) => ({
          ...w,
          startMs: w.startMs + sceneStartMs,
          endMs: w.endMs + sceneStartMs,
        })),
      );
    }
    const footage =
      footageRange && assets.sourceVideo
        ? {
            assetId: sourceAssetId,
            fromMs: footageRange.fromMs,
            transform: fitCover(
              assets.sourceVideo.info,
              target,
              faceFocus(content, footageRange),
            ),
          }
        : undefined;
    return {
      id: beat.id,
      startMs: sceneStartMs,
      durationMs,
      background: { kind: "brand" as const },
      ...(footage ? { footage } : {}),
      ...(beat.camera ? { camera: beat.camera } : {}),
      elements,
      transition: "cut" as const,
    };
  });
  const speech = speechIntervals(captionWords);
  const docAssets: VideoDoc["assets"] = [];
  if (assets.sourceVideo) {
    docAssets.push({
      id: sourceAssetId,
      kind: "video",
      src: assets.sourceVideo.path,
      durationMs: assets.sourceVideo.info.durationMs,
      width: assets.sourceVideo.info.width,
      height: assets.sourceVideo.info.height,
    });
  }
  if (assets.music)
    docAssets.push({
      id: musicAssetId,
      kind: "audio",
      src: assets.music.path,
      durationMs: assets.music.durationMs,
    });
  for (const spoken of assets.voice ?? []) {
    docAssets.push({
      id: `voice-${spoken.beatId}`,
      kind: "audio",
      src: spoken.path,
      durationMs: spoken.durationMs,
    });
  }
  const captions =
    plan.captions.enabled && captionWords.length > 0
      ? { style: plan.captions.style, pages: captionPages(captionWords) }
      : undefined;
  const music = assets.music
    ? { assetId: musicAssetId, volume: 0.9, duckTo: 0.25, speech }
    : undefined;
  return VideoDocSchema.parse({
    id: `${plan.destination}-${
      plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "video"
    }`,
    format: destination.format,
    fps: 30,
    durationMs: plan.lengthMs,
    destination: plan.destination,
    register: plan.register,
    brand,
    assets: docAssets,
    scenes,
    ...(captions ? { captions } : {}),
    ...(music ? { music } : {}),
    voice,
  });
}
