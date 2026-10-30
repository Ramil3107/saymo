import { expect, test } from "vitest";
import { panelBox, panelSide } from "../layouts";

test("panelBox spans the top of the frame for a top panel and one side for a side panel", () => {
  expect(panelBox("panel-top", "left")).toEqual({ x: 0, y: 0, w: 1, h: 0.46 });
  expect(panelBox("panel-side", "left")).toEqual({ x: 0, y: 0, w: 0.46, h: 1 });
  expect(panelBox("panel-side", "right")).toEqual({ x: 0.54, y: 0, w: 0.46, h: 1 });
});

test("panelSide takes the side away from the face", () => {
  expect(panelSide({ x: 0.3, y: 0.3 })).toBe("right");
  expect(panelSide({ x: 0.7, y: 0.3 })).toBe("left");
  expect(panelSide(undefined)).toBe("right");
});
