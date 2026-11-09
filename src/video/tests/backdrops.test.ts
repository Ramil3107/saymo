import { expect, it } from "vitest";
import { backdrops } from "../backdrops";
import { styleBackdrop, styles } from "../styles";

it("lists known backdrops in every style, the first being the style's old look", () => {
  expect(styles["bold-pop"].backdrops[0]).toBe("glow");
  expect(styles["clean-paper"].backdrops[0]).toBe("paper-grid");

  for (const style of Object.values(styles)) {
    expect(new Set(style.backdrops).size).toBe(style.backdrops.length);
    for (const id of style.backdrops) expect(backdrops[id]).toBeDefined();
  }
});

it("gives every backdrop to at least one style", () => {
  const offered = new Set(Object.values(styles).flatMap((style) => style.backdrops));

  expect([...offered].sort()).toEqual(Object.keys(backdrops).sort());
});

it("grounds text on the color and night backdrops only", () => {
  const grounded = Object.entries(backdrops).flatMap(([id, backdrop]) =>
    backdrop.ground ? [[id, backdrop.ground]] : [],
  );

  expect(grounded).toEqual([
    ["color", "accent"],
    ["night", "ink"],
  ]);
});

it("keeps a backdrop the style lists and falls back to the style's first", () => {
  expect(styleBackdrop("clean-paper", "night")).toBe("night");
  expect(styleBackdrop("bold-pop", "sketchbook")).toBe("glow");
  expect(styleBackdrop("bold-pop")).toBe("glow");
  expect(styleBackdrop("clean-paper")).toBe("paper-grid");
});
