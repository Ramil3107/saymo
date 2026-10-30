import type { CSSProperties } from "react";
import { interpolateColors } from "remotion";
import { flipFace, type MoveSpec, mix } from "../../motion/moves";
import { chase, eased, type Float, floatAt, staggered } from "../../motion/timeline";
import { Move, useMs } from "../motion/Move";
import type { DemoProps, Palette } from "./looks";

const startMs = 250;
const exitAtMs = 2400;
const morphAtMs = 900;
const flipAtMs = 1100;
const floatShare = 0.011;
const chipsExitAtMs = 3900;
const floatDegrees = 0.8;
const chips = ["Same-day slots", "No waiting list", "From $29"];
const months = ["NOV", "DEC", "JAN"];
const burstRays = 10;
const rayAngles = Array.from({ length: burstRays }, (_, ray) => (ray / burstRays) * Math.PI * 2);
const chevronCount = 3;

const column: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

export function PopChipsDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const ms = useMs();

  return (
    <div style={{ ...column, gap: height * 0.035 }}>
      {chips.map((text, index) => {
        const spec: MoveSpec = {
          enter: "pop",
          atMs: staggered(startMs, index, tempo.wordMs),
          exit: { move: "collapse", atMs: staggered(chipsExitAtMs, chips.length - index, tempo.staggerMs) },
        };
        const float = floatAt(ms, spec.atMs, index);
        return (
          <Move
            key={text}
            spec={spec}
            tempo={tempo}
            unitPx={width}
            style={{ marginLeft: (index - 1) * width * 0.12 }}
          >
            <Chip text={text} badge={String(index + 1)} palette={palette} width={width} float={float} />
          </Move>
        );
      })}
    </div>
  );
}

export function SmearChevronsDemo({ look, width }: DemoProps) {
  const { palette, tempo } = look;
  const ms = useMs();
  const chevronsOn = ms >= startMs + tempo.moveMs && ms < exitAtMs;
  const pill: CSSProperties = {
    padding: `${width * 0.03}px ${width * 0.06}px`,
    borderRadius: 999,
    backgroundColor: palette.accent,
    color: palette.surface,
    fontSize: width * 0.065,
    fontWeight: 800,
    letterSpacing: "0.06em",
  };

  return (
    <div style={{ ...column, flexDirection: "row", gap: width * 0.04 }}>
      {chevronsOn ? <Chevrons ms={ms} look={look} width={width} pointing="right" /> : null}
      <Move
        spec={{ enter: "smear", atMs: startMs, exit: { move: "smear", atMs: exitAtMs } }}
        tempo={tempo}
        unitPx={width}
      >
        <div style={pill}>NEW FEATURE</div>
      </Move>
      {chevronsOn ? <Chevrons ms={ms} look={look} width={width} pointing="left" /> : null}
    </div>
  );
}

export function MorphBurstDemo({ look, width }: DemoProps) {
  const { palette, tempo } = look;
  const ms = useMs();
  const shrinkMs = tempo.moveMs * 1.5;
  const widenAtMs = morphAtMs + shrinkMs + tempo.quickMs;
  const shrunk = eased(ms, morphAtMs, shrinkMs, tempo.moveCurve);
  const widened = eased(ms, widenAtMs, tempo.moveMs * 2, tempo.enterCurve);

  return (
    <div style={column}>
      <Move
        spec={{ enter: "pop", atMs: startMs, exit: { move: "collapse", atMs: exitAtMs } }}
        tempo={tempo}
        unitPx={width}
      >
        <div style={{ position: "relative" }}>
          <div style={morphBox(width, palette, shrunk, widened)}>
            <span style={{ fontSize: width * 0.09, fontWeight: 900, color: palette.surface }}>Saymo</span>
          </div>
          <Burst ms={ms} atMs={widenAtMs + tempo.moveMs} look={look} width={width} />
        </div>
      </Move>
    </div>
  );
}

export function FlipCardsDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const exit: MoveSpec["exit"] = { move: "sink", atMs: exitAtMs };

  return (
    <div style={{ ...column, gap: height * 0.05 }}>
      <Move spec={{ enter: "rise", atMs: startMs, exit }} tempo={tempo} unitPx={width}>
        <div style={{ fontSize: width * 0.1, fontWeight: 900, color: palette.ink }}>Paid monthly.</div>
      </Move>
      <div style={{ display: "flex", gap: width * 0.04 }}>
        {months.map((month, index) => (
          <Move
            key={month}
            spec={{ enter: "pop", atMs: staggered(startMs + tempo.moveMs, index, tempo.staggerMs), exit }}
            tempo={tempo}
            unitPx={width}
          >
            <CalendarCard
              month={month}
              flipAtMs={staggered(flipAtMs, index, tempo.wordMs)}
              look={look}
              width={width}
            />
          </Move>
        ))}
      </div>
    </div>
  );
}

function Chip(props: { text: string; badge: string; palette: Palette; width: number; float: Float }) {
  const { text, badge, palette, width, float } = props;
  const amplitude = width * floatShare;
  const size = width * 0.075;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: width * 0.025,
        padding: `${width * 0.018}px ${width * 0.045}px ${width * 0.018}px ${width * 0.018}px`,
        borderRadius: 999,
        backgroundColor: palette.surface,
        boxShadow: "0 10px 28px rgba(10, 10, 20, 0.14)",
        transform: `translate(${float.x * amplitude}px, ${float.y * amplitude}px) rotate(${float.rotate * floatDegrees}deg)`,
        fontSize: width * 0.055,
        fontWeight: 700,
        color: palette.ink,
      }}
    >
      <span style={{ ...badgeCircle(size), backgroundColor: palette.accent, color: palette.surface }}>
        {badge}
      </span>
      {text}
    </div>
  );
}

function Chevrons(props: { ms: number; look: DemoProps["look"]; width: number; pointing: "left" | "right" }) {
  const { ms, look, width, pointing } = props;
  const size = width * 0.07;
  const order = Array.from({ length: chevronCount }, (_, index) =>
    pointing === "right" ? index : chevronCount - 1 - index,
  );

  return (
    <svg width={size * chevronCount * 0.7} height={size} viewBox={`0 0 ${chevronCount * 7} 10`} aria-hidden>
      {order.map((step, position) => (
        <polyline
          key={step}
          points={pointing === "right" ? "1,1 5,5 1,9" : "5,1 1,5 5,9"}
          transform={`translate(${position * 7}, 0)`}
          fill="none"
          stroke={look.palette.accent}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={chase(ms, look.tempo.blinkMs * 2, chevronCount, step) ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

function morphBox(width: number, palette: Palette, shrunk: number, widened: number): CSSProperties {
  const boxWidth =
    widened > 0 ? mix(width * 0.08, width * 0.62, widened) : mix(width * 0.72, width * 0.08, shrunk);

  return {
    width: boxWidth,
    height: width * 0.15,
    borderRadius: mix(width * 0.025, width * 0.075, shrunk),
    backgroundColor: interpolateColors(shrunk, [0, 1], [palette.surface, palette.accent]),
    border: `2px solid ${interpolateColors(shrunk, [0, 1], [palette.muted, palette.accent])}`,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function Burst(props: { ms: number; atMs: number; look: DemoProps["look"]; width: number }) {
  const { ms, atMs, look, width } = props;
  const p = eased(ms, atMs, look.tempo.moveMs * 3, look.tempo.enterCurve);
  if (p <= 0 || p >= 1) return null;

  const size = width * 0.3;
  const inner = mix(0.25, 0.42, p) * size;
  const outer = inner + (1 - p) * size * 0.14;

  return (
    <svg width={size} height={size} style={burstBox(size)} aria-hidden>
      {rayAngles.map((angle) => (
        <line
          key={angle}
          {...rayEnds(angle, size / 2, inner, outer)}
          stroke={look.palette.ink}
          strokeWidth={width * 0.006}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function CalendarCard(props: { month: string; flipAtMs: number; look: DemoProps["look"]; width: number }) {
  const { month, flipAtMs, look, width } = props;
  const ms = useMs();
  const face = flipFace(eased(ms, flipAtMs, look.tempo.quickMs * 2, look.tempo.moveCurve));
  const tone = face.back ? look.palette.accentAlt : look.palette.accent;
  const card: CSSProperties = { transform: `scaleX(${face.scaleX})`, borderColor: tone };

  return (
    <div style={{ ...calendar(width), ...card, backgroundColor: look.palette.surface }}>
      <div
        style={{
          backgroundColor: tone,
          color: look.palette.surface,
          fontSize: width * 0.03,
          fontWeight: 800,
        }}
      >
        {month}
      </div>
      <div style={{ fontSize: width * 0.085, fontWeight: 900, color: face.back ? tone : look.palette.ink }}>
        {face.back ? "✓" : "1"}
      </div>
    </div>
  );
}

function burstBox(size: number): CSSProperties {
  return { position: "absolute", right: -size * 0.45, top: -size * 0.45 };
}

function rayEnds(angle: number, center: number, inner: number, outer: number) {
  return {
    x1: center + Math.cos(angle) * inner,
    y1: center + Math.sin(angle) * inner,
    x2: center + Math.cos(angle) * outer,
    y2: center + Math.sin(angle) * outer,
  };
}

function badgeCircle(size: number): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.55,
    fontWeight: 800,
  };
}

function calendar(width: number): CSSProperties {
  return {
    width: width * 0.17,
    height: width * 0.2,
    borderRadius: width * 0.025,
    border: "2px solid",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    justifyContent: "space-between",
    paddingBottom: width * 0.02,
  };
}
