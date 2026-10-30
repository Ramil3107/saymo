import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { isKeyword } from "../../captions/rail";
import type { SafeZone } from "../../destinations";
import { captionBand } from "../../layout/safeZones";
import { poseAt } from "../../motion/moves";
import { eased } from "../../motion/timeline";
import type { CaptionPage, VideoDoc } from "../../schema/video";
import { frameToMs } from "../frames";
import { accentColor, type Theme, textOn, textShadow, white } from "../theme";

type CaptionsDoc = NonNullable<VideoDoc["captions"]>;
type Props = { captions: CaptionsDoc; theme: Theme; safeZone: SafeZone };
type Token = CaptionPage["tokens"][number];
type WordProps = { token: Token; keyword: boolean; ms: number; theme: Theme; fontSize: number };

const fontShare = 0.03;
const taggedFontShare = 0.036;
const pageInMs = 140;
const wordInMs = 220;
const riseFromPx = 14;
const scaleFrom = 1.06;
const dimOpacity = 0.42;
const scrimTopShare = 0.56;
const tagSweepMoves = 2;

export function CaptionRail({ captions, theme, safeZone }: Props) {
  const ms = frameToMs(useCurrentFrame());
  const { height } = useVideoConfig();
  const page = captions.pages.find((candidate) => isShowing(candidate, ms));

  return (
    <>
      <div style={scrimStyle(height)} />
      {page ? <RailPage page={page} captions={captions} theme={theme} safeZone={safeZone} ms={ms} /> : null}
    </>
  );
}

function RailPage({ page, captions, theme, safeZone, ms }: Props & { page: CaptionPage; ms: number }) {
  const { width, height } = useVideoConfig();
  const tagged = captions.style === "keyword-box";
  const fontSize = height * (tagged ? taggedFontShare : fontShare);
  const entrance = tagged ? {} : pageEntrance(page, ms);

  return (
    <div
      data-element-id="captions"
      style={{ ...pageStyle(captionBand(safeZone), width, height, fontSize, tagged), ...entrance }}
    >
      {page.tokens.map((token) => (
        <RailWord
          key={`${token.fromMs}-${token.text}`}
          token={token}
          keyword={isKeyword(token.text, captions.keywords)}
          tagged={tagged}
          ms={ms}
          theme={theme}
          fontSize={fontSize}
        />
      ))}
    </div>
  );
}

function isShowing(page: CaptionPage, ms: number): boolean {
  return ms >= page.startMs && ms < page.startMs + page.durationMs;
}

function pageStyle(
  band: { x: number; y: number; w: number; h: number },
  width: number,
  height: number,
  fontSize: number,
  tagged: boolean,
): CSSProperties {
  return {
    position: "absolute",
    left: band.x * width,
    width: band.w * width,
    bottom: (1 - band.y - band.h) * height,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignContent: "flex-end",
    columnGap: fontSize * 0.3,
    rowGap: tagged ? fontSize * 0.12 : 2,
    fontSize,
    fontWeight: tagged ? 900 : 800,
    lineHeight: 1.12,
    textAlign: "center",
    textTransform: tagged ? "uppercase" : undefined,
  };
}

function pageEntrance(page: CaptionPage, ms: number): CSSProperties {
  const progress = reveal(ms, page.startMs, pageInMs);
  return { opacity: progress, transform: `translateY(${(1 - progress) * riseFromPx}px)` };
}

function RailWord(props: WordProps & { tagged: boolean }) {
  const { tagged, ...word } = props;
  if (tagged) return <TaggedWord {...word} />;

  return (
    <span style={wordStyle(word.token, word.ms, word.keyword, word.theme, word.fontSize)}>
      {word.token.text}
    </span>
  );
}

function wordStyle(
  token: Token,
  ms: number,
  keyword: boolean,
  theme: Theme,
  fontSize: number,
): CSSProperties {
  const progress = reveal(ms, token.fromMs, wordInMs);
  const revealed = ms >= token.fromMs;
  const color = revealed && keyword ? accentColor(theme) : white;

  return {
    display: "inline-block",
    color,
    opacity: dimOpacity + (1 - dimOpacity) * progress,
    transform: `scale(${scaleFrom - (scaleFrom - 1) * progress})`,
    textShadow: textShadow(fontSize),
  };
}

function TaggedWord(props: WordProps) {
  const { token, keyword, ms, theme, fontSize } = props;
  const pose = poseAt(ms, { enter: "pop", atMs: token.fromMs }, theme.tempo);
  const swept = eased(ms, token.fromMs, theme.tempo.moveMs * tagSweepMoves, theme.tempo.enterCurve);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        visibility: pose ? "visible" : "hidden",
        opacity: pose?.opacity ?? 0,
        transform: `scale(${pose?.scale ?? 1})`,
        ...(keyword ? tagBox(accentColor(theme), swept, fontSize) : {}),
      }}
    >
      <span style={{ color: white, textShadow: keyword && swept >= 1 ? "none" : textShadow(fontSize) }}>
        {token.text}
      </span>
      {keyword ? (
        <SweptText text={token.text} color={textOn(accentColor(theme))} swept={swept} fontSize={fontSize} />
      ) : null}
    </span>
  );
}

// The dark copy is clipped to the box, so the word turns dark only where the box has already passed under it.
function SweptText({
  text,
  color,
  swept,
  fontSize,
}: {
  text: string;
  color: string;
  swept: number;
  fontSize: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        padding: tagPadding(fontSize),
        color,
        clipPath: `inset(0 ${(1 - swept) * 100}% 0 0)`,
      }}
    >
      {text}
    </span>
  );
}

function tagBox(color: string, swept: number, fontSize: number): CSSProperties {
  return {
    backgroundImage: `linear-gradient(${color}, ${color})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${swept * 100}% 100%`,
    padding: tagPadding(fontSize),
    borderRadius: fontSize * 0.16,
  };
}

function tagPadding(fontSize: number): string {
  return `0 ${fontSize * 0.22}px`;
}

function reveal(ms: number, fromMs: number, durationMs: number): number {
  return interpolate(ms, [fromMs, fromMs + durationMs], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function scrimStyle(height: number): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    top: height * scrimTopShare,
    bottom: 0,
    background:
      "linear-gradient(to bottom, rgba(4,10,28,0) 0%, rgba(4,10,28,0.38) 45%, rgba(4,10,28,0.55) 100%)",
  };
}
