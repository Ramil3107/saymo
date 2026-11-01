import { measureText } from "@remotion/layout-utils";
import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import type { Field } from "../../layout/compositions";
import type { MoveSpec } from "../../motion/moves";
import { eased } from "../../motion/timeline";
import { Move, useMs } from "../motion/Move";
import { wholePx } from "../motion/pixels";
import type { StyleKit } from "../style/kit";
import type { Frame } from "../theme";

type Props = { fields: Field[]; kit: StyleKit; frame: Frame; sceneMs: number };
type FieldProps = { field: Field } & Omit<Props, "fields">;
type Echo = NonNullable<Field["echo"]>;
type EchoLook = { style: CSSProperties; line: string; step: number; rowHeight: number };

const sweepMoves = 2;
const cardRadiusShare = 0.04;
const hardShadowShare = 0.016;
const softShadow = "0 30px 80px rgba(10, 10, 20, 0.28)";
const echoFontShare = 0.8;
const echoStrokeShare = 0.018;
const echoOpacity = 0.55;
const echoStaggerMs = 60;

// The color fields of a composition, under the elements and over the backdrop.
export function Fields({ fields, kit, frame, sceneMs }: Props) {
  return (
    <AbsoluteFill>
      {fields.map((field) => (
        <FieldView
          key={`${field.tone}-${field.box.x}-${field.box.y}-${field.enterMs}`}
          field={field}
          kit={kit}
          frame={frame}
          sceneMs={sceneMs}
        />
      ))}
    </AbsoluteFill>
  );
}

function FieldView(props: FieldProps) {
  const { echo } = props.field;
  if (echo) return <EchoRows {...props} echo={echo} />;
  if (props.field.raised) return <RaisedCard {...props} />;
  return <FieldBlock {...props} />;
}

// The field's word in outlined rows; each row slides in from alternating sides, then stands still.
function EchoRows({ field, kit, frame, echo }: FieldProps & { echo: Echo }) {
  const rowHeight = (field.box.h * frame.height) / echo.rows;
  const fontSize = rowHeight * echoFontShare;
  const text = kit.style.display.upper ? echo.text.toUpperCase() : echo.text;
  const font = { fontFamily: kit.display.family, fontWeight: kit.display.weight, fontSize };
  const step = measureText({ ...font, text: `${text} ` }).width;
  const repeats = Math.ceil((field.box.w * frame.width) / step) + 2;
  const look: EchoLook = {
    style: {
      ...font,
      position: "absolute",
      height: wholePx(rowHeight),
      lineHeight: `${wholePx(rowHeight)}px`,
      whiteSpace: "pre",
      color: "transparent",
      WebkitTextStroke: `${Math.max(1, wholePx(fontSize * echoStrokeShare))}px ${kit.fields[field.tone].background}`,
    },
    line: Array.from({ length: repeats }, () => text).join(" "),
    step,
    rowHeight,
  };

  return (
    <div style={{ ...boxStyle(field, frame), overflow: "hidden", opacity: echoOpacity }}>
      {rowsOf(echo).map((row) => (
        <EchoRow key={row} row={row} look={look} field={field} kit={kit} />
      ))}
    </div>
  );
}

// Rows alternate a half-word offset, so the words stagger like bricks.
function EchoRow({ row, look, field, kit }: { row: number; look: EchoLook; field: Field; kit: StyleKit }) {
  const ms = useMs();
  const { tempo } = kit;
  const shown = eased(ms, field.enterMs + row * echoStaggerMs, tempo.moveMs * sweepMoves, tempo.enterCurve);
  if (shown <= 0) return null;

  const even = row % 2 === 0;
  const rest = -look.step * (even ? 1 : 0.5);
  const travel = (even ? -1 : 1) * look.step * (1 - shown);

  return (
    <div
      style={{
        ...look.style,
        top: wholePx(row * look.rowHeight),
        left: wholePx(rest + travel),
        opacity: shown,
      }}
    >
      {look.line}
    </div>
  );
}

// A card lands in place with the style's corners and shadow: a hard offset for slabs, a soft drop for pills.
function RaisedCard({ field, kit, frame, sceneMs }: FieldProps) {
  const colors = kit.fields[field.tone];
  const exit: MoveSpec["exit"] = field.exitMs < sceneMs ? { move: "fade", atMs: field.exitMs } : undefined;
  const slab = kit.label.shape === "slab";
  const offset = wholePx(frame.width * hardShadowShare);

  return (
    <Move
      spec={{ enter: "lift", atMs: field.enterMs, exit }}
      tempo={kit.tempo}
      unitPx={frame.width}
      style={boxStyle(field, frame)}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: colors.background,
          borderRadius: slab ? 0 : wholePx(frame.width * cardRadiusShare),
          boxShadow: slab ? `${offset}px ${offset}px 0 ${hardShade(kit, field)}` : softShadow,
        }}
      />
    </Move>
  );
}

// A hard shadow is ink under a light card and the card's accent under a dark one, so it shows on either ground.
function hardShade(kit: StyleKit, field: Field): string {
  const colors = kit.fields[field.tone];
  return colors.ink === kit.palette.ink ? kit.palette.ink : colors.accent;
}

// A field sweeps in from its edge; one that leaves before its scene ends sweeps on toward the far edge.
function FieldBlock({ field, kit, frame, sceneMs }: FieldProps) {
  const ms = useMs();
  const { tempo } = kit;
  const sweepMs = tempo.moveMs * sweepMoves;
  const shown = eased(ms, field.enterMs, sweepMs, tempo.enterCurve);
  const gone = field.exitMs < sceneMs ? eased(ms, field.exitMs - sweepMs, sweepMs, tempo.exitCurve) : 0;
  if (shown <= 0 || gone >= 1) return null;

  return (
    <div style={{ ...boxStyle(field, frame), clipPath: sweepClip(field.from, shown, gone) }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: kit.fields[field.tone].background,
          clipPath: field.outline ? outlineClip(field.outline) : undefined,
        }}
      />
    </div>
  );
}

function rowsOf(echo: Echo): number[] {
  return Array.from({ length: echo.rows }, (_, row) => row);
}

function boxStyle({ box }: Field, frame: Frame): CSSProperties {
  return {
    position: "absolute",
    left: wholePx(box.x * frame.width),
    top: wholePx(box.y * frame.height),
    width: wholePx(box.w * frame.width),
    height: wholePx(box.h * frame.height),
  };
}

function sweepClip(from: Field["from"], shown: number, gone: number): string | undefined {
  if (shown >= 1 && gone <= 0) return undefined;
  const hidden = `${(1 - shown) * 100}%`;
  const cut = `${gone * 100}%`;

  switch (from) {
    case "left":
      return `inset(0 ${hidden} 0 ${cut})`;
    case "right":
      return `inset(0 ${cut} 0 ${hidden})`;
    case "top":
      return `inset(${cut} 0 ${hidden} 0)`;
    case "bottom":
      return `inset(${hidden} 0 ${cut} 0)`;
  }
}

function outlineClip(outline: NonNullable<Field["outline"]>): string {
  return `polygon(${outline.map((point) => `${point.x * 100}% ${point.y * 100}%`).join(", ")})`;
}
