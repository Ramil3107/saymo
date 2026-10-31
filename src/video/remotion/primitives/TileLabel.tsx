import type { FieldTone } from "../../layout/compositions";
import type { Element } from "../../schema/video";
import { wholePx } from "../motion/pixels";
import type { Frame, Theme } from "../theme";
import { ElementBox } from "./ElementBox";
import { fittedSize, labelText } from "./labelStyle";

type Props = { element: Element; on: FieldTone; text: string; badge?: string; theme: Theme; frame: Frame };

const paddingShare = 0.12;
const fontShare = 0.17;
const badgeScale = 0.6;
const lineHeight = 1.04;

// A label that owns a tile of a grid: no background of its own, the tile's colors, as large as the tile allows.
export function TileLabel({ element, on, text, badge, theme, frame }: Props) {
  const { kit } = theme;
  const colors = kit.fields[on];
  const width = element.box.w * frame.width;
  const height = element.box.h * frame.height;
  const padding = wholePx(Math.min(width, height) * paddingShare);
  const shown = labelText(kit, text);
  const fontSize = fittedSize(kit, longestWord(shown), height * fontShare, width - padding * 2);

  return (
    <ElementBox element={element} theme={theme} frame={frame} style={{ alignItems: "stretch" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding,
          fontFamily: kit.display.family,
          fontWeight: kit.display.weight,
          lineHeight,
          color: colors.ink,
        }}
      >
        <div style={{ fontSize: fontSize * badgeScale, color: colors.accent }}>{badge ?? ""}</div>
        <div data-anchor style={{ fontSize }}>
          {shown}
        </div>
      </div>
    </ElementBox>
  );
}

function longestWord(text: string): string {
  return text.split(/\s+/).reduce((longest, word) => (word.length > longest.length ? word : longest), "");
}
