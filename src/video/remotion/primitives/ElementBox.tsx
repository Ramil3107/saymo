import type { CSSProperties, ReactNode } from "react";
import type { Element } from "../../schema/video";
import type { Frame, Theme } from "../theme";
import { type MotionPreset, motionStyle, useMotion } from "./motion";

type Props = {
  element: Element;
  theme: Theme;
  frame: Frame;
  children: ReactNode;
  style?: CSSProperties;
  preset?: MotionPreset;
};

export function ElementBox({ element, theme, frame, children, style, preset = "rise" }: Props) {
  const motion = useMotion(element, theme.register, preset);
  if (!motion.visible) return null;

  const box: CSSProperties = {
    position: "absolute",
    left: element.box.x * frame.width,
    top: element.box.y * frame.height,
    width: element.box.w * frame.width,
    height: element.box.h * frame.height,
    display: "flex",
    alignItems: "center",
  };

  return (
    <div data-element-id={element.id} style={{ ...box, ...motionStyle(motion, preset), ...style }}>
      {children}
    </div>
  );
}
