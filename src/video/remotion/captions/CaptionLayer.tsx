import { fitText } from "@remotion/layout-utils";
import { type CSSProperties, Fragment } from "react";
import { type CaptionLook, type CaptionSize, captionLooks } from "../../captions/looks";
import { isKeyword } from "../../captions/rail";
import type { SafeZone } from "../../destinations";
import { captionBand } from "../../layout/safeZones";
import type { CaptionPage, VideoDoc } from "../../schema/video";
import { serifFamily } from "../fonts";
import { useMs } from "../motion/Move";
import type { Frame, Theme } from "../theme";
import { CaptionWord } from "./CaptionWord";

type CaptionsDoc = NonNullable<VideoDoc["captions"]>;
type Props = { captions: CaptionsDoc; theme: Theme; safeZone: SafeZone; frame: Frame };
type PageProps = Omit<Props, "captions"> & {
  page: CaptionPage;
  look: CaptionLook;
  keywords: string[];
  ms: number;
};

const sizeShare: Record<CaptionSize, number> = { s: 0.026, m: 0.032, l: 0.04, xl: 0.062 };
const middleBottomShare = 0.3;
const scrimTopShare = 0.56;
const lineHeight = 1.2;
const fitShare = 0.94;

export function CaptionLayer({ captions, theme, safeZone, frame }: Props) {
  const ms = useMs();
  const look = captionLooks[captions.style];
  const page = captions.pages.find(
    (candidate) => ms >= candidate.startMs && ms < candidate.startMs + candidate.durationMs,
  );

  return (
    <>
      {look.backing === "scrim" ? <div style={scrimStyle(frame.height)} /> : null}
      {page ? (
        <PageView
          page={page}
          look={look}
          keywords={captions.keywords}
          theme={theme}
          safeZone={safeZone}
          frame={frame}
          ms={ms}
        />
      ) : null}
    </>
  );
}

function PageView({ page, look, keywords, theme, safeZone, frame, ms }: PageProps) {
  const fontSize = pageFontSize(page, look, theme, safeZone, frame);
  const words = page.tokens.map((token, index) => (
    <Fragment key={`${token.fromMs}-${token.text}`}>
      {index > 0 ? " " : null}
      <CaptionWord
        token={token}
        look={look}
        keyword={isKeyword(token.text, keywords)}
        ms={ms}
        theme={theme}
        fontSize={fontSize}
      />
    </Fragment>
  ));

  return (
    <div data-element-id="captions" style={pageStyle(look, theme, safeZone, frame, fontSize)}>
      {look.backing === "dark-pill" || look.backing === "light-pill" ? (
        <span style={pillStyle(look)}>{words}</span>
      ) : (
        words
      )}
    </div>
  );
}

function pageFontSize(
  page: CaptionPage,
  look: CaptionLook,
  theme: Theme,
  safeZone: SafeZone,
  frame: Frame,
): number {
  const longest = page.tokens
    .map((token) => token.text.trim())
    .reduce((a, b) => (b.length > a.length ? b : a), "");
  const fitted = fitText({
    text: look.letterCase === "upper" ? longest.toUpperCase() : longest,
    withinWidth: captionBand(safeZone).w * frame.width * fitShare,
    fontFamily: look.font === "serif" ? serifFamily : theme.fontFamily,
    fontWeight: look.weight,
  });

  return Math.min(frame.height * sizeShare[look.size], fitted.fontSize);
}

function pageStyle(
  look: CaptionLook,
  theme: Theme,
  safeZone: SafeZone,
  frame: Frame,
  fontSize: number,
): CSSProperties {
  const band = captionBand(safeZone);
  const bottom = look.place === "middle" ? middleBottomShare : 1 - band.y - band.h;

  return {
    position: "absolute",
    left: band.x * frame.width,
    width: band.w * frame.width,
    bottom: bottom * frame.height,
    textAlign: "center",
    fontSize,
    lineHeight,
    fontFamily: look.font === "serif" ? serifFamily : theme.fontFamily,
    textTransform: casing(look),
  };
}

function casing(look: CaptionLook): CSSProperties["textTransform"] {
  switch (look.letterCase) {
    case "upper":
      return "uppercase";
    case "lower":
      return "lowercase";
    case "sentence":
      return undefined;
  }
}

function pillStyle(look: CaptionLook): CSSProperties {
  return {
    backgroundColor: look.backing === "light-pill" ? "rgba(255, 255, 255, 0.95)" : "rgba(8, 10, 20, 0.72)",
    padding: "0.14em 0.42em",
    borderRadius: "0.32em",
    lineHeight: 1.62,
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };
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
