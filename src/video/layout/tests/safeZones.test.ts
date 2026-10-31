import { expect, test } from "vitest";
import { destinations } from "../../destinations";
import { type Avoid, captionBand, placeOverlay } from "../safeZones";

const none: Avoid = { soft: [], hard: [] };

test("placeOverlay moves a chip away from a face", () => {
  const box = placeOverlay("chip", "9:16", destinations.reels.safeZone, {
    soft: [{ x: 0.05, y: 0.6, w: 0.5, h: 0.35 }],
    hard: [],
  });
  expect(box.x).toBeGreaterThan(0.5);
});

test("placeOverlay keeps a headline inside the safe zone", () => {
  const zone = destinations.reels.safeZone;
  const box = placeOverlay("headline", "9:16", zone, none);
  expect(box.y).toBeGreaterThanOrEqual(zone.top);
  expect(box.x + box.w).toBeLessThanOrEqual(1 - zone.right + 1e-9);
  expect(box.h).toBeCloseTo(0.18, 6);
});

test("placeOverlay takes the least overlapping slot when nothing is free", () => {
  const everywhere = [{ x: 0, y: 0, w: 1, h: 0.76 }];
  const box = placeOverlay("headline", "9:16", destinations.reels.safeZone, { soft: everywhere, hard: [] });
  expect(box.y).toBeCloseTo(1 - 0.22 - 0.04 - 0.18, 6);
});

test("placeOverlay centers a headline on the frame, not on the lopsided safe zone", () => {
  const box = placeOverlay("headline", "9:16", destinations.reels.safeZone, none);
  expect(box.x + box.w / 2).toBeCloseTo(0.5, 6);
});

test("captionBand is centered on the frame", () => {
  const band = captionBand(destinations.reels.safeZone);
  expect(band.x + band.w / 2).toBeCloseTo(0.5, 6);
});

test("placeOverlay keeps a chip off the edge of the safe zone", () => {
  const zone = destinations.reels.safeZone;
  const box = placeOverlay("chip", "9:16", zone, none);
  expect(box.x).toBeGreaterThanOrEqual(zone.left + 0.03);
  expect(box.y + box.h).toBeLessThanOrEqual(1 - zone.bottom - 0.03);
});

test("placeOverlay covers a face before it covers the captions when nothing is free", () => {
  const zone = destinations.reels.safeZone;
  const band = captionBand(zone);
  const face = { x: 0, y: 0, w: 1, h: band.y };
  const box = placeOverlay(
    "chip",
    "9:16",
    zone,
    { soft: [face], hard: [band] },
    { measured: { w: 0.35, h: 0.06 } },
  );

  expect(box.y + box.h <= band.y || box.y >= band.y + band.h).toBe(true);
});

test("placeOverlay gathers labels in the middle of a backdrop and at the edges over footage", () => {
  const zone = destinations.reels.safeZone;
  const size = { w: 0.3, h: 0.05 };
  const onBackdrop = placeOverlay("chip", "9:16", zone, none, { measured: size, onBackdrop: true });
  const overFootage = placeOverlay("chip", "9:16", zone, none, { measured: size });

  expect(onBackdrop.x + onBackdrop.w / 2).toBeCloseTo(0.5, 2);
  expect(overFootage.x).toBeLessThan(0.1);
});

test("placeOverlay puts the next label on a backdrop below the one in the middle", () => {
  const zone = destinations.reels.safeZone;
  const size = { w: 0.3, h: 0.05 };
  const first = placeOverlay("chip", "9:16", zone, none, { measured: size, onBackdrop: true });
  const second = placeOverlay(
    "chip",
    "9:16",
    zone,
    { soft: [], hard: [first] },
    { measured: size, onBackdrop: true },
  );

  expect(second.y).toBeGreaterThan(first.y);
});

test("placeOverlay gives a title only the height its lines need", () => {
  const zone = destinations.reels.safeZone;
  const slot = placeOverlay("title", "9:16", zone, none);
  const short = placeOverlay("title", "9:16", zone, none, { titleSizes: ["l", "m"] });

  expect(short.h).toBeLessThan(slot.h);
  expect(placeOverlay("title", "9:16", zone, none, { titleSizes: ["xl", "xl", "xl"] }).h).toBe(slot.h);
});
