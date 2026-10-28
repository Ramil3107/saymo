import type { ReactNode } from "react";
import type { Element } from "../../schema/video";
import type { Frame, Theme } from "../theme";
import { revealStyle, useEntrance } from "./entrance";

export function ElementBox({
  element,
  theme,
  frame,
  children,
  style,
}: {
  element: Element;
  theme: Theme;
  frame: Frame;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  const { visible, progress } = useEntrance(element, theme.register);
  if (!visible) return null;
  return (
    <div
      data-element-id={element.id}
      style={{
        position: "absolute",
        left: element.box.x * frame.width,
        top: element.box.y * frame.height,
        width: element.box.w * frame.width,
        height: element.box.h * frame.height,
        display: "flex",
        alignItems: "center",
        ...revealStyle(progress),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
