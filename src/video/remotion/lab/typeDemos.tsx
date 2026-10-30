import type { CSSProperties } from "react";
import type { Exit, MoveSpec } from "../../motion/moves";
import type { TitleEntrance, TitleLine } from "../../type/schedule";
import { CornerLabel } from "../type/CornerLabel";
import { Counter } from "../type/Counter";
import { KineticTitle, type TitleProps } from "../type/KineticTitle";
import type { DemoProps, Look } from "./looks";

type Kit = Pick<TitleProps, "colors" | "font" | "tempo">;

const atMs = 250;
const exitAtMs = 2900;
const titleShare = 0.86;
const titleWeight = 900;

const centered: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function HookDemo(props: DemoProps) {
  return title(props, "type", [
    { text: "STOP", size: "xl", tone: "ink", align: "left" },
    { text: "SCROLLING.", size: "xl", tone: "accent", align: "left" },
  ]);
}

export function HierarchyDemo(props: DemoProps) {
  return title(props, "rise", [
    { text: "Your clinic,", size: "m", tone: "ink", align: "left" },
    { text: "fully booked", size: "l", tone: "accent", align: "center" },
    { text: "by Friday.", size: "m", tone: "ink", align: "right" },
  ]);
}

export function TrackingDemo(props: DemoProps) {
  return title(props, "spread", [
    { text: "NEW", size: "xl", tone: "ink", align: "center" },
    { text: "DROP", size: "xl", tone: "accent", align: "center" },
  ]);
}

export function PopWordsDemo(props: DemoProps) {
  return title(props, "pop", [
    { text: "Fast.", size: "l", tone: "ink", align: "left" },
    { text: "Fresh.", size: "l", tone: "accent", align: "center" },
    { text: "Local.", size: "l", tone: "ink", align: "right" },
  ]);
}

export function MarkerDemo(props: DemoProps) {
  return title(props, "reveal", [
    { text: "Results in", size: "m", tone: "ink", align: "left" },
    { text: "24 hours", size: "xl", tone: "ink", align: "left", marked: true },
  ]);
}

export function SwapDemo(props: DemoProps) {
  const lines: TitleLine[] = [
    { text: "LAUNCH", size: "xl", tone: "ink", align: "center" },
    { text: "DAY", size: "xl", tone: "accent", align: "center" },
  ];

  return (
    <div style={centered}>
      <KineticTitle
        {...kit(props.look)}
        lines={lines}
        entrance="punch"
        atMs={atMs}
        swapAtMs={1700}
        exit={{ move: "tilt", atMs: exitAtMs }}
        width={props.width * titleShare}
      />
    </div>
  );
}

export function CounterDemo({ look, width }: DemoProps) {
  return (
    <div style={centered}>
      <Counter
        {...kit(look)}
        from={0}
        to={40}
        prefix="-"
        suffix="%"
        label="this week only"
        ghost
        atMs={atMs}
        exit={{ move: "collapse", atMs: exitAtMs }}
        width={width * titleShare}
      />
    </div>
  );
}

export function HudDemo({ look, width }: DemoProps) {
  const shared = { ...kit(look), exit: { move: "fade", atMs: exitAtMs } satisfies MoveSpec["exit"] };

  return (
    <div style={centered}>
      <CornerLabel {...shared} text="30 sec" corner="top-left" chevrons atMs={atMs} width={width} />
      <CornerLabel
        {...shared}
        text="duration"
        corner="bottom-right"
        chevrons
        atMs={atMs + 200}
        width={width}
      />
      <Counter
        {...shared}
        from={0}
        to={425000}
        prefix="£"
        label="Elm Grove, 3 bed"
        atMs={atMs}
        width={width * titleShare}
      />
    </div>
  );
}

function title({ look, width }: DemoProps, entrance: TitleEntrance, lines: TitleLine[]) {
  return (
    <div style={centered}>
      <KineticTitle
        {...kit(look)}
        lines={lines}
        entrance={entrance}
        atMs={atMs}
        exit={{ move: exitFor(entrance), atMs: exitAtMs }}
        width={width * titleShare}
      />
    </div>
  );
}

function kit(look: Look): Kit {
  const { palette, tempo, fontFamily } = look;

  return {
    tempo,
    font: { family: fontFamily, weight: titleWeight },
    colors: { ink: palette.ink, accent: palette.accent, alt: palette.accentAlt, marker: palette.highlight },
  };
}

function exitFor(entrance: TitleEntrance): Exit {
  switch (entrance) {
    case "type":
      return "fade";
    case "rise":
      return "sink";
    case "spread":
      return "collapse";
    case "pop":
      return "smear";
    case "punch":
    case "reveal":
      return "tilt";
  }
}
