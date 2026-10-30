import { expect, test } from "vitest";
import { destinations } from "../../destinations";
import { captionBand, placeOverlay } from "../safeZones";

test("placeOverlay moves a chip away from a face", () => {
  const box = placeOverlay("chip", "9:16", destinations.reels.safeZone, [
    { x: 0.05, y: 0.6, w: 0.5, h: 0.35 },
  ]);
  expect(box.x).toBeGreaterThan(0.5);
});

test("placeOverlay keeps a headline inside the safe zone", () => {
  const zone = destinations.reels.safeZone;
  const box = placeOverlay("headline", "9:16", zone, []);
  expect(box.y).toBeGreaterThanOrEqual(zone.top);
  expect(box.x + box.w).toBeLessThanOrEqual(1 - zone.right + 1e-9);
  expect(box.h).toBeCloseTo(0.18, 6);
});

test("placeOverlay takes the least overlapping slot when nothing is free", () => {
  const everywhere = [{ x: 0, y: 0, w: 1, h: 0.76 }];
  const box = placeOverlay("headline", "9:16", destinations.reels.safeZone, everywhere);
  expect(box.y).toBeCloseTo(0.6, 6);
});

test("placeOverlay centers a headline on the frame, not on the lopsided safe zone", () => {
  const box = placeOverlay("headline", "9:16", destinations.reels.safeZone, []);
  expect(box.x + box.w / 2).toBeCloseTo(0.5, 6);
});

test("captionBand is centered on the frame", () => {
  const band = captionBand(destinations.reels.safeZone);
  expect(band.x + band.w / 2).toBeCloseTo(0.5, 6);
});
