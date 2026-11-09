import { expect, it } from "vitest";
import { FieldToneSchema } from "../compositions";
import { toneOnGround } from "../ground";

const grounds = ["accent", "ink"] as const;

it("swaps only the tones that would vanish on the ground", () => {
  expect(toneOnGround("accent", "accent")).toBe("ink");
  expect(toneOnGround("ink", "ink")).toBe("accent");
  expect(toneOnGround("alt", "ink")).toBe("highlight");
  expect(toneOnGround("highlight", "accent")).toBe("highlight");
  expect(toneOnGround("surface", "ink")).toBe("surface");
});

it("leaves every tone alone on a light backdrop", () => {
  for (const tone of FieldToneSchema.options) expect(toneOnGround(tone, undefined)).toBe(tone);
});

it("never gives a field the ground's own tone", () => {
  for (const ground of grounds) {
    for (const tone of FieldToneSchema.options) expect(toneOnGround(tone, ground)).not.toBe(ground);
  }
});
