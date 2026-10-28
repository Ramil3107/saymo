import { fitText } from "@remotion/layout-utils";
import { interpolate, useCurrentFrame } from "remotion";
import type { Element } from "../../schema/video";
import { frameToMs } from "../frames";
import { accentColor, type Frame, type Theme } from "../theme";
import { ElementBox } from "./ElementBox";

type BigNumberElement = Extract<Element, { kind: "big-number" }>;

function countUp(value: string, progress: number): string {
  const match = value.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return value;
  const [, prefix = "", digits = "0", suffix = ""] = match;
  const target = Number(digits.replace(",", "."));
  const decimals = (digits.split(/[.,]/)[1] ?? "").length;
  return `${prefix}${(target * progress).toFixed(decimals)}${suffix}`;
}

export function BigNumber({
  element,
  theme,
  frame,
}: {
  element: BigNumberElement;
  theme: Theme;
  frame: Frame;
}) {
  const ms = frameToMs(useCurrentFrame());
  const progress = interpolate(
    ms,
    [element.enterMs, element.enterMs + 900],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const fontWeight = theme.register.fontWeight[1];
  const { fontSize } = fitText({
    text: element.value,
    withinWidth: width,
    fontFamily: theme.fontFamily,
    fontWeight,
  });
  const valueSize = Math.min(
    fontSize,
    element.label ? height * 0.62 : height * 0.9,
  );
  return (
    <ElementBox
      element={element}
      theme={theme}
      frame={frame}
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: valueSize,
          fontWeight,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: accentColor(theme),
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
            color: "#FFFFFF",
          }}
        >
          {element.label}
        </div>
      ) : null}
    </ElementBox>
  );
}
