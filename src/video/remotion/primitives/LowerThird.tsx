import { fitText } from "@remotion/layout-utils";
import { accentColor, ink, type PrimitiveProps, white } from "../theme";
import { ElementBox } from "./ElementBox";

const nameWeight = 800;
const paddingShare = 0.25;
const nameShare = 0.56;
const nameShareWithRole = 0.5;

export function LowerThird({ element, theme, frame }: PrimitiveProps<"lower-third">) {
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const padding = height * paddingShare;

  const { fontSize } = fitText({
    text: element.name,
    withinWidth: width - padding * 2,
    fontFamily: theme.fontFamily,
    fontWeight: nameWeight,
  });
  const nameSize = Math.min(fontSize, height * (element.role ? nameShareWithRole : nameShare));

  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end" }}
    >
      <div
        style={{
          backgroundColor: accentColor(theme),
          color: ink,
          borderRadius: height * 0.18,
          padding: `${padding * 0.4}px ${padding}px`,
          fontSize: nameSize,
          fontWeight: nameWeight,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {element.name}
      </div>
      {element.role ? (
        <div
          style={{
            marginTop: padding * 0.3,
            backgroundColor: white,
            color: ink,
            borderRadius: height * 0.14,
            padding: `${padding * 0.25}px ${padding * 0.8}px`,
            fontSize: nameSize * 0.6,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {element.role}
        </div>
      ) : null}
    </ElementBox>
  );
}
