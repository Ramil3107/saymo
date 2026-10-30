import { fitTextOnNLines } from "@remotion/layout-utils";
import { accentColor, type PrimitiveProps, textShadow, white } from "../theme";
import { ElementBox } from "./ElementBox";

const maxLines = 3;
const barShare = 0.08;
const textShare = 0.3;
const textShareWithAuthor = 0.26;

export function Quote({ element, theme, frame }: PrimitiveProps<"quote">) {
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const bar = height * barShare;

  const { fontSize } = fitTextOnNLines({
    text: element.text,
    maxLines,
    maxBoxWidth: width - bar * 3,
    fontFamily: theme.fontFamily,
    fontWeight: 700,
    maxFontSize: height * (element.author ? textShareWithAuthor : textShare),
  });

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div
        style={{ width: bar, borderRadius: bar, backgroundColor: accentColor(theme), marginRight: bar * 2 }}
      />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            lineHeight: 1.12,
            color: white,
            textShadow: textShadow(fontSize),
          }}
        >
          {element.text}
        </div>
        {element.author ? (
          <div
            style={{
              marginTop: fontSize * 0.4,
              fontSize: fontSize * 0.5,
              fontWeight: 500,
              color: white,
              opacity: 0.8,
              textShadow: textShadow(fontSize),
            }}
          >
            {element.author}
          </div>
        ) : null}
      </div>
    </ElementBox>
  );
}
