import type { CSSProperties, ReactNode } from "react";
import type { Element } from "../../schema/video";
import type { Frame, Theme } from "../theme";
import { revealStyle, useEntrance } from "./entrance";

type Props = {
  element: Element;
  theme: Theme;
  frame: Frame;
  children: ReactNode;
  style?: CSSProperties;
};

export function ElementBox({ element, theme, frame, children, style }: Props) {
  const { visible, progress } = useEntrance(element, theme.register);
  if (!visible) return null;

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
    <div data-element-id={element.id} style={{ ...box, ...revealStyle(progress), ...style }}>
      {children}
    </div>
  );
}
