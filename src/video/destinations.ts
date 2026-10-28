import { z } from "zod";

export const DestinationIdSchema = z.enum(["reels", "stories", "shorts", "linkedin", "youtube", "file"]);

export type DestinationId = z.infer<typeof DestinationIdSchema>;

export const FormatSchema = z.enum(["9:16", "1:1", "16:9"]);

export type Format = z.infer<typeof FormatSchema>;

export type SafeZone = { top: number; bottom: number; left: number; right: number };

export type Destination = {
  format: Format;
  maxLengthMs: number;
  safeZone: SafeZone;
  captionsDefault: boolean;
};

const appOverlaySafeZone: SafeZone = { top: 0.14, bottom: 0.22, left: 0.04, right: 0.14 };
const marginSafeZone: SafeZone = { top: 0.05, bottom: 0.05, left: 0.05, right: 0.05 };

export const destinations: Record<DestinationId, Destination> = {
  reels: { format: "9:16", maxLengthMs: 180_000, safeZone: appOverlaySafeZone, captionsDefault: true },
  stories: { format: "9:16", maxLengthMs: 60_000, safeZone: appOverlaySafeZone, captionsDefault: true },
  shorts: { format: "9:16", maxLengthMs: 180_000, safeZone: appOverlaySafeZone, captionsDefault: true },
  linkedin: { format: "16:9", maxLengthMs: 600_000, safeZone: marginSafeZone, captionsDefault: true },
  youtube: { format: "16:9", maxLengthMs: 600_000, safeZone: marginSafeZone, captionsDefault: false },
  file: { format: "9:16", maxLengthMs: 600_000, safeZone: marginSafeZone, captionsDefault: false },
};

const frameSizes: Record<Format, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

export function formatSize(format: Format): { width: number; height: number } {
  return { ...frameSizes[format] };
}
