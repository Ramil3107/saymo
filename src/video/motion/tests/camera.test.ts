import { expect, it } from "vitest";
import type { Camera } from "../../schema/plan";
import { backdropPunchZoom, backdropPushZoom, backdropView } from "../camera";
import { tempos } from "../tempo";

const durationMs = 2400;
const frameMs = 1000 / 30;
const kinds = ["none", "push", "punch-in", "pan"] as const;
const intensities = [0.5, 1];
const tenths = Array.from({ length: 11 }, (_, index) => (durationMs * index) / 10);

it("leaves the backdrop at rest without a camera", () => {
  const rest = { scale: 1, x: 0, y: 0 };

  expect(backdropView(undefined, 900, durationMs, tempos.snap)).toEqual(rest);
  expect(backdropView({ kind: "none", intensity: 1 }, 900, durationMs, tempos.snap)).toEqual(rest);
});

it("pushes in over the whole beat", () => {
  const push: Camera = { kind: "push", intensity: 0.5 };
  const scales = tenths.map((ms) => backdropView(push, ms, durationMs, tempos.glide).scale);

  expect(scales[0]).toBe(1);
  expect(scales.at(-1)).toBeCloseTo(1 + backdropPushZoom * 0.5, 6);
  for (let index = 1; index < scales.length; index++) {
    expect(scales[index] ?? 0).toBeGreaterThan(scales[index - 1] ?? 0);
  }
});

it("never shows the backdrop's edge, whatever the move, its strength and the moment", () => {
  for (const kind of kinds) {
    for (const intensity of intensities) {
      for (const ms of tenths) {
        const view = backdropView({ kind, intensity }, ms, durationMs, tempos.snap);
        expect(view.scale / 2).toBeGreaterThanOrEqual(0.5 + Math.abs(view.x) - 1e-9);
        expect(view.scale / 2).toBeGreaterThanOrEqual(0.5 + Math.abs(view.y) - 1e-9);
      }
    }
  }
});

it("slides a pan across the beat", () => {
  const pan: Camera = { kind: "pan", intensity: 1 };
  const start = backdropView(pan, 0, durationMs, tempos.glide);
  const end = backdropView(pan, durationMs, durationMs, tempos.glide);

  expect(start.x).toBeGreaterThan(0);
  expect(end.x).toBeLessThan(0);
  expect(end.y).toBeGreaterThan(start.y);
});

it("snaps a punch-in on the tempo, then keeps creeping in so it never comes to rest", () => {
  const punch: Camera = { kind: "punch-in", intensity: 1 };
  const snappedMs = tempos.snap.moveMs * 2;
  const scaleAt = (ms: number) => backdropView(punch, ms, durationMs, tempos.snap).scale;

  expect(scaleAt(0)).toBe(1);
  expect(scaleAt(snappedMs)).toBeCloseTo(1 + backdropPunchZoom, 6);
  for (let ms = snappedMs + frameMs; ms <= durationMs; ms += frameMs) {
    expect(scaleAt(ms)).toBeGreaterThan(scaleAt(ms - frameMs));
  }
});
