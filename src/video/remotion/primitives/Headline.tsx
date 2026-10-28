import { fitTextOnNLines } from "@remotion/layout-utils";
import { type PrimitiveProps, white } from "../theme";
import { ElementBox } from "./ElementBox";

const maxLines = 2;
const titleShare = 0.46;
const titleShareWithSub = 0.36;

export function Headline({ element, theme, frame }: PrimitiveProps<"headline">) {
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const fontWeight = theme.register.fontWeight[1];

  const { fontSize } = fitTextOnNLines({
    text: element.text,
    maxLines,
    maxBoxWidth: width,
    fontFamily: theme.fontFamily,
    fontWeight,
    maxFontSize: height * (element.sub ? titleShareWithSub : titleShare),
  });

  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}
    >
      <div style={{ fontSize, fontWeight, lineHeight: 1.02, letterSpacing: "-0.03em", color: white }}>
        {element.text}
      </div>
      {element.sub ? (
        <div
          style={{
            marginTop: fontSize * 0.3,
            fontSize: fontSize * 0.42,
            fontWeight: 500,
            color: white,
            opacity: 0.85,
          }}
        >
          {element.sub}
        </div>
      ) : null}
    </ElementBox>
  );
}
