import { AbsoluteFill } from "remotion";
import type { Field } from "../../layout/compositions";
import { eased } from "../../motion/timeline";
import { useMs } from "../motion/Move";
import { wholePx } from "../motion/pixels";
import type { StyleKit } from "../style/kit";
import type { Frame } from "../theme";

type Props = { fields: Field[]; kit: StyleKit; frame: Frame; sceneMs: number };

const sweepMoves = 2;

// The color fields of a composition, under the elements and over the backdrop.
export function Fields({ fields, kit, frame, sceneMs }: Props) {
  return (
    <AbsoluteFill>
      {fields.map((field) => (
        <FieldBlock
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

// A field sweeps in from its edge; one that leaves before its scene ends sweeps on toward the far edge.
function FieldBlock({ field, kit, frame, sceneMs }: { field: Field } & Omit<Props, "fields">) {
  const ms = useMs();
  const { tempo } = kit;
  const sweepMs = tempo.moveMs * sweepMoves;
  const shown = eased(ms, field.enterMs, sweepMs, tempo.enterCurve);
  const gone = field.exitMs < sceneMs ? eased(ms, field.exitMs - sweepMs, sweepMs, tempo.exitCurve) : 0;
  if (shown <= 0 || gone >= 1) return null;

  const { box } = field;
  return (
    <div
      style={{
        position: "absolute",
        left: wholePx(box.x * frame.width),
        top: wholePx(box.y * frame.height),
        width: wholePx(box.w * frame.width),
        height: wholePx(box.h * frame.height),
        backgroundColor: kit.fields[field.tone].background,
        clipPath: sweepClip(field.from, shown, gone),
      }}
    />
  );
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
