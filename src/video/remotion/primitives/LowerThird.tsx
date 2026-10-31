import type { CSSProperties } from "react";
import type { StyleKit } from "../style/kit";
import type { PrimitiveProps } from "../theme";
import { ElementBox } from "./ElementBox";
import { fittedSize, labelBox, labelText } from "./labelStyle";

const paddingShare = 0.25;
const nameShare = 0.56;
const nameShareWithRole = 0.5;
const roleScale = 0.6;
const barShare = 0.08;

export function LowerThird({ element, theme, frame }: PrimitiveProps<"lower-third">) {
  const { kit } = theme;
  const height = element.box.h * frame.height;
  const padding = height * paddingShare;
  const name = labelText(kit, element.name);
  const maxSize = height * (element.role ? nameShareWithRole : nameShare);
  const nameSize = fittedSize(kit, name, maxSize, element.box.w * frame.width - padding * 2);

  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end" }}
    >
      <div style={{ ...nameStyle(kit, nameSize, padding), ...accentBar(kit, height) }}>{name}</div>
      {element.role ? <div style={roleStyle(kit, nameSize, padding)}>{element.role}</div> : null}
    </ElementBox>
  );
}

function nameStyle(kit: StyleKit, fontSize: number, padding: number): CSSProperties {
  return {
    ...labelBox(kit, fontSize, true),
    padding: `${padding * 0.4}px ${padding}px`,
    fontSize,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  };
}

function accentBar(kit: StyleKit, height: number): CSSProperties {
  return kit.label.shape === "slab"
    ? { borderLeft: `${height * barShare}px solid ${kit.palette.accent}` }
    : {};
}

function roleStyle(kit: StyleKit, nameSize: number, padding: number): CSSProperties {
  const slab = kit.label.shape === "slab";

  return {
    marginTop: padding * 0.3,
    backgroundColor: slab ? kit.palette.ink : kit.palette.surface,
    color: slab ? kit.palette.surface : kit.palette.accent,
    borderRadius: slab ? 2 : nameSize * 0.4,
    padding: `${padding * 0.25}px ${padding * 0.8}px`,
    fontFamily: kit.textFamily,
    fontSize: nameSize * roleScale,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}
