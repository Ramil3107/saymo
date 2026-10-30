import type { CSSProperties, ReactNode } from "react";
import { exitMs, type MoveSpec } from "../../motion/moves";
import { floatAt } from "../../motion/timeline";
import type { Element } from "../../schema/video";
import { Move, useMs } from "../motion/Move";
import type { Frame, Theme } from "../theme";

export type MotionPreset = "pop" | "rise";

type Props = {
  element: Element;
  theme: Theme;
  frame: Frame;
  children: ReactNode;
  style?: CSSProperties;
  preset?: MotionPreset;
};

const floatShare = 0.004;
const floatDegrees = 0.8;

export function ElementBox({ element, theme, frame, children, style, preset = "rise" }: Props) {
  const height = element.box.h * frame.height;
  const inner: CSSProperties = { alignItems: "center", justifyContent: "flex-start", ...style };

  return (
    <div data-element-id={element.id}>
      <Move
        spec={specFor(element, theme, preset)}
        tempo={theme.tempo}
        unitPx={height}
        style={boxStyle(element, frame)}
        innerStyle={inner}
      >
        {preset === "pop" ? (
          <Floating element={element} frame={frame}>
            {children}
          </Floating>
        ) : (
          children
        )}
      </Move>
    </div>
  );
}

function boxStyle(element: Element, frame: Frame): CSSProperties {
  return {
    position: "absolute",
    left: element.box.x * frame.width,
    top: element.box.y * frame.height,
    width: element.box.w * frame.width,
    height: element.box.h * frame.height,
  };
}

function specFor(element: Element, theme: Theme, preset: MotionPreset): MoveSpec {
  const exit = preset === "pop" ? "collapse" : "fade";
  const exitAtMs = Math.max(element.enterMs, element.exitMs - exitMs(exit, theme.tempo));

  return {
    enter: preset === "pop" ? "pop" : "lift",
    atMs: element.enterMs,
    exit: { move: exit, atMs: exitAtMs },
  };
}

function Floating({ element, frame, children }: { element: Element; frame: Frame; children: ReactNode }) {
  const float = floatAt(useMs(), element.enterMs, seedOf(element.id));
  const amplitude = frame.height * floatShare;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "inherit",
        transform: `translate(${float.x * amplitude}px, ${float.y * amplitude}px) rotate(${float.rotate * floatDegrees}deg)`,
      }}
    >
      {children}
    </div>
  );
}

function seedOf(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value % 997;
}
