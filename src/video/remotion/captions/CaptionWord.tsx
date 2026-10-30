import type { CSSProperties } from "react";
import { interpolateColors } from "remotion";
import { type CaptionLook, typedLetters, wordPhase } from "../../captions/looks";
import { mix, poseAt } from "../../motion/moves";
import { eased, linear, smoothstep } from "../../motion/timeline";
import type { CaptionPage } from "../../schema/video";
import { accentColor, ink, type Theme, textOn, textShadow, white } from "../theme";

export type WordProps = {
  token: CaptionPage["tokens"][number];
  look: CaptionLook;
  keyword: boolean;
  ms: number;
  theme: Theme;
  fontSize: number;
};

type Phase = ReturnType<typeof wordPhase>;
type Motion = { opacity: number; scale: number; riseEm: number; weight: number; fill: number };

const dimOpacity = 0.42;
const lightWeight = 300;
const activeScale = 1.08;
const riseFromEm = 0.35;
const sweepMoves = 2;
const weightMoves = 1.5;
const fadeInShare = 0.4;
const pillPadEm = 0.18;
const markerAlpha = "C0";

export function CaptionWord(props: WordProps) {
  const { token, look, ms, keyword } = props;
  const phase = wordPhase(token, ms);
  if (phase === "upcoming" && look.upcoming === "absent") return null;

  const motion = withActiveScale(motionOf(props, phase), look, phase);
  const swept = sweepOf(props, phase);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        visibility: phase === "upcoming" && look.upcoming === "hidden" ? "hidden" : "visible",
        ...baseStyle(props, motion),
        ...activeStyle(props, phase),
        ...(keyword && phase !== "upcoming" ? keywordStyle(props, swept) : {}),
      }}
    >
      <WordText {...props} />
      {keyword && look.keyword === "box" ? <SweptText {...props} swept={swept} /> : null}
    </span>
  );
}

function motionOf({ token, look, ms, theme }: WordProps, phase: Phase): Motion {
  const rest: Motion = { opacity: 1, scale: 1, riseEm: 0, weight: look.weight, fill: 1 };
  if (phase === "upcoming") return upcomingMotion(look, rest);

  const { tempo } = theme;
  const shown = smoothstep(Math.min(1, linear(ms, token.fromMs, tempo.moveMs) / fadeInShare));
  const moved = eased(ms, token.fromMs, tempo.moveMs, tempo.enterCurve);

  switch (look.enter) {
    case "pop":
      return popMotion(rest, ms, token.fromMs, tempo);
    case "rise":
      return { ...rest, opacity: shown, riseEm: (1 - moved) * riseFromEm };
    case "fade":
      return { ...rest, opacity: smoothstep(linear(ms, token.fromMs, tempo.moveMs)) };
    case "weight":
      return {
        ...rest,
        weight: mix(
          lightWeight,
          look.weight,
          eased(ms, token.fromMs, tempo.moveMs * weightMoves, tempo.moveCurve),
        ),
      };
    case "fill":
      return { ...rest, fill: moved };
    case "type":
    case "none":
      return rest;
  }
}

function popMotion(rest: Motion, ms: number, atMs: number, tempo: Theme["tempo"]): Motion {
  const pose = poseAt(ms, { enter: "pop", atMs }, tempo);

  return { ...rest, opacity: pose?.opacity ?? 1, scale: pose?.scale ?? 1 };
}

function withActiveScale(motion: Motion, look: CaptionLook, phase: Phase): Motion {
  if (phase !== "active" || look.active !== "scale") return motion;

  return { ...motion, scale: motion.scale * activeScale };
}

function upcomingMotion(look: CaptionLook, rest: Motion): Motion {
  switch (look.enter) {
    case "weight":
      return { ...rest, weight: lightWeight };
    case "fill":
      return { ...rest, fill: 0 };
    case "pop":
    case "rise":
    case "fade":
    case "type":
    case "none":
      return { ...rest, opacity: look.upcoming === "dim" ? dimOpacity : 1 };
  }
}

function sweepOf({ token, ms, theme }: WordProps, phase: Phase): number {
  if (phase === "upcoming") return 0;

  return eased(ms, token.fromMs, theme.tempo.moveMs * sweepMoves, theme.tempo.enterCurve);
}

function baseStyle({ look, fontSize }: WordProps, motion: Motion): CSSProperties {
  const onLight = look.backing === "light-pill";
  const shadowed = look.backing === "shadow" || look.backing === "scrim";
  const textColor = onLight ? ink : white;

  return {
    opacity: motion.opacity,
    transform: `translateY(${motion.riseEm}em) scale(${motion.scale})`,
    fontWeight: Math.round(motion.weight),
    color:
      look.enter === "fill"
        ? interpolateColors(motion.fill, [0, 1], ["rgba(255,255,255,0)", textColor])
        : textColor,
    WebkitTextStroke: look.enter === "fill" ? `${fontSize * 0.03}px ${textColor}` : undefined,
    textShadow: shadowed ? textShadow(fontSize) : undefined,
    padding: look.active === "pill" ? `0 ${pillPadEm}em` : undefined,
    borderRadius: look.active === "pill" ? `${pillPadEm}em` : undefined,
  };
}

function activeStyle({ look, theme }: WordProps, phase: Phase): CSSProperties {
  if (phase !== "active") return {};

  switch (look.active) {
    case "color":
      return { color: accentColor(theme) };
    case "pill":
      return { backgroundColor: accentColor(theme), color: textOn(accentColor(theme)), textShadow: "none" };
    case "scale":
    case "none":
      return {};
  }
}

function keywordStyle({ look, theme, fontSize }: WordProps, swept: number): CSSProperties {
  const accent = accentColor(theme);

  switch (look.keyword) {
    case "color":
      return { color: accent };
    case "box":
      return {
        ...sweptBackground(accent, swept, "100%"),
        ...(swept >= 1 ? { textShadow: "none" } : {}),
        padding: `0 ${fontSize * 0.22}px`,
        borderRadius: fontSize * 0.16,
      };
    case "marker":
      return { ...sweptBackground(`${accent}${markerAlpha}`, swept, "38%"), backgroundPosition: "0 92%" };
    case "italic":
      return { fontStyle: "italic", color: accent };
    case "none":
      return {};
  }
}

function WordText({ token, look, ms }: WordProps) {
  const text = token.text.trim();
  if (look.enter !== "type") return <>{text}</>;

  return <>{text.slice(0, typedLetters({ ...token, text }, ms))}</>;
}

// The dark copy is clipped to the box, so the word turns dark only where the box has already passed under it.
function SweptText({ token, theme, fontSize, swept }: WordProps & { swept: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        padding: `0 ${fontSize * 0.22}px`,
        color: textOn(accentColor(theme)),
        textShadow: "none",
        clipPath: `inset(0 ${(1 - swept) * 100}% 0 0)`,
      }}
    >
      {token.text.trim()}
    </span>
  );
}

function sweptBackground(color: string, swept: number, height: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(${color}, ${color})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0 50%",
    backgroundSize: `${swept * 100}% ${height}`,
  };
}
