import { fitText } from "@remotion/layout-utils";
import { interpolate, useCurrentFrame } from "remotion";
import { frameToMs } from "../frames";
import { accentColor, type PrimitiveProps, textShadow, white } from "../theme";
import { ElementBox } from "./ElementBox";

const countUpMs = 900;
const valueShare = 0.9;
const valueShareWithLabel = 0.62;

export function BigNumber({ element, theme, frame }: PrimitiveProps<"big-number">) {
  const ms = frameToMs(useCurrentFrame());
  const progress = interpolate(ms, [element.enterMs, element.enterMs + countUpMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const fontWeight = theme.register.fontWeight[1];

  const { fontSize } = fitText({
    text: element.value,
    withinWidth: width,
    fontFamily: theme.fontFamily,
    fontWeight,
  });
  const valueSize = Math.min(fontSize, height * (element.label ? valueShareWithLabel : valueShare));

  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          fontSize: valueSize,
          fontWeight,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: accentColor(theme),
          textShadow: textShadow(valueSize),
        }}
      >
        {countUp(element.value, progress)}
      </div>
      {element.label ? (
        <div
          style={{
            marginTop: valueSize * 0.12,
            fontSize: valueSize * 0.32,
            fontWeight: 700,
            color: white,
            textShadow: textShadow(valueSize),
          }}
        >
          {element.label}
        </div>
      ) : null}
    </ElementBox>
  );
}

function countUp(value: string, progress: number): string {
  const match = value.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return value;

  const [, prefix = "", digits = "0", suffix = ""] = match;
  const target = Number(digits.replace(",", "."));
  const decimals = (digits.split(/[.,]/)[1] ?? "").length;

  return `${prefix}${(target * progress).toFixed(decimals)}${suffix}`;
}
