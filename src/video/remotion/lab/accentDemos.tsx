import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { poseAt } from "../../motion/moves";
import { Blobs } from "../accents/Blobs";
import { Burst } from "../accents/Burst";
import { CornerBrackets } from "../accents/CornerBrackets";
import { Cursor } from "../accents/Cursor";
import { DrawnArrow } from "../accents/DrawnArrow";
import { FlashBlocks } from "../accents/FlashBlocks";
import { Grain } from "../accents/Grain";
import { GrowFrame } from "../accents/GrowFrame";
import { rectStyle } from "../accents/geometry";
import { Halftone } from "../accents/Halftone";
import { PaperGrid } from "../accents/PaperGrid";
import { Scribble } from "../accents/Scribble";
import { SelectionBox } from "../accents/SelectionBox";
import { Sparkles } from "../accents/Sparkles";
import { useMs } from "../motion/Move";
import { TypeOn } from "../motion/TypeOn";
import type { DemoProps } from "./looks";

const subject = "subject.jpg";
const fill: CSSProperties = { position: "absolute", inset: 0 };

export function FrameGrowDemo({ look, width, height }: DemoProps) {
  const from = { x: width / 2 - 10, y: height * 0.3, w: 20, h: 20 };
  const to = { x: width * 0.06, y: height * 0.06, w: width * 0.88, h: height * 0.6 };

  return (
    <div style={fill}>
      <Subject />
      <GrowFrame
        from={from}
        to={to}
        atMs={500}
        holdMs={1400}
        tempo={look.tempo}
        color={look.palette.accent}
        strokePx={6}
      />
    </div>
  );
}

export function FlashDemo({ look, width, height }: DemoProps) {
  const tile = { w: width / 2, h: height / 2 };
  const tiles = [0, 1, 2, 3].map((index) => ({
    x: (index % 2) * tile.w,
    y: Math.floor(index / 2) * tile.h,
    ...tile,
  }));
  const blocks = [tiles[0], tiles[3], tiles[1]].flatMap((rect) => (rect ? [rect] : []));

  return (
    <div style={fill}>
      {tiles.map((rect, index) => (
        <Img
          key={`${rect.x}-${rect.y}`}
          src={staticFile(subject)}
          style={{
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            objectFit: "cover",
            objectPosition: `${30 + index * 15}% ${20 + index * 10}%`,
          }}
        />
      ))}
      <FlashBlocks blocks={blocks} atMs={900} tempo={look.tempo} color={look.palette.accent} />
    </div>
  );
}

export function BurstSparklesDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const center = { x: width / 2, y: height / 2 };
  const sparkles = [
    { x: center.x - width * 0.3, y: center.y - height * 0.06 },
    { x: center.x + width * 0.34, y: center.y + height * 0.05 },
    { x: center.x - width * 0.18, y: center.y + height * 0.08 },
  ];

  return (
    <div style={{ ...fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Popped atMs={250} look={look}>
        <div style={pillStyle(width, palette.accent, palette.surface)}>Saymo</div>
      </Popped>
      <Burst
        at={{ x: center.x + width * 0.27, y: center.y - height * 0.04 }}
        atMs={500}
        size={width * 0.16}
        tempo={tempo}
        color={palette.ink}
      />
      <Sparkles points={sparkles} atMs={600} size={width * 0.06} tempo={tempo} color={palette.highlight} />
    </div>
  );
}

export function ArrowBadgeDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const label = { x: width * 0.08, y: height * 0.8 };

  return (
    <div style={fill}>
      <Subject />
      <div style={labelRowStyle(label, width)}>
        <Popped atMs={300} look={look}>
          <div style={badge(width, palette.accent, palette.surface)}>1</div>
        </Popped>
        <div style={labelTextStyle(width, palette.surface)}>
          <TypeOn text="PRIMARY JOB" atMs={450} tempo={tempo} />
        </div>
      </div>
      <DrawnArrow
        from={{ x: width * 0.5, y: label.y - height * 0.015 }}
        to={{ x: width * 0.68, y: height * 0.56 }}
        bend={0.3}
        atMs={800}
        tempo={tempo}
        color={palette.highlight}
        widthPx={width * 0.012}
      />
    </div>
  );
}

export function SelectionTagDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const tag = { x: width * 0.24, y: height * 0.46, w: width * 0.52, h: width * 0.16 };

  return (
    <div style={fill}>
      <PaperGrid cellPx={width * 0.06} lineColor="rgba(20,20,26,0.06)" vignette={0.22} />
      <div style={headlineStyle(width, height, palette.ink)}>Customers wait</div>
      <Popped atMs={300} look={look} style={rectStyle(tag)}>
        <div style={tagStyle(width, palette.highlight, palette.ink)}>9 hours</div>
      </Popped>
      <SelectionBox rect={tag} atMs={650} tempo={tempo} color={palette.accentAlt} handlePx={width * 0.025} />
      <Sparkles
        points={[
          { x: tag.x + tag.w + width * 0.05, y: tag.y - width * 0.03 },
          { x: tag.x - width * 0.05, y: tag.y + tag.h + width * 0.02 },
        ]}
        atMs={1000}
        size={width * 0.045}
        tempo={tempo}
        color={palette.accent}
      />
    </div>
  );
}

export function ScribbleDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const no = { x: width * 0.36, y: height * 0.34, w: width * 0.28, h: width * 0.2 };
  const waiting = { x: width * 0.1, y: height * 0.48, w: width * 0.5, h: width * 0.11 };
  const words: CSSProperties = { position: "absolute", fontWeight: 900, color: palette.ink, lineHeight: 1 };
  const pen = { tempo, color: palette.accent, widthPx: width * 0.012 };

  return (
    <div style={fill}>
      <div style={{ ...words, left: no.x, top: no.y, width: no.w, fontSize: no.h, textAlign: "center" }}>
        No
      </div>
      <div style={{ ...words, left: waiting.x, top: waiting.y, fontSize: waiting.h }}>waiting list</div>
      <Scribble kind="circle" around={no} atMs={500} {...pen} />
      <Scribble kind="underline" around={waiting} atMs={1100} {...pen} />
    </div>
  );
}

export function CursorClickDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const button = { x: width * 0.2, y: height * 0.52, w: width * 0.6, h: width * 0.15 };
  const target = { x: button.x + button.w * 0.62, y: button.y + button.h * 0.55 };
  const clickMs = 500 + tempo.moveMs * 3;
  const booked = useMs() >= clickMs + tempo.quickMs;

  return (
    <div style={fill}>
      <div style={card(width, height, palette.surface)} />
      <div style={cardTitleStyle(button.x, width, height, palette.ink)}>Same-day slots</div>
      <div style={buttonStyle(button, booked ? palette.accentAlt : palette.accent, palette.surface, width)}>
        {booked ? "Booked ✓" : "Book a visit"}
      </div>
      <Cursor
        from={{ x: width * 0.85, y: height * 0.85 }}
        to={target}
        atMs={500}
        tempo={tempo}
        color={palette.accent}
        size={width * 0.08}
      />
    </div>
  );
}

export function TexturesDemo({ look, width, height }: DemoProps) {
  const { palette } = look;
  const quarter = { width: width / 2, height: height / 2 };

  return (
    <div style={fill}>
      <Quarter left={0} top={0} {...quarter} label="grain" color={palette.surface}>
        <div
          style={{ ...fill, background: `linear-gradient(160deg, ${palette.accent}, ${palette.accentAlt})` }}
        />
        <Grain opacity={0.55} />
      </Quarter>
      <Quarter left={quarter.width} top={0} {...quarter} label="paper grid" color={palette.ink}>
        <div style={{ ...fill, backgroundColor: "#F4F1EA" }} />
        <PaperGrid cellPx={width * 0.05} lineColor="rgba(20,20,26,0.08)" vignette={0.3} />
      </Quarter>
      <Quarter left={0} top={quarter.height} {...quarter} label="halftone" color={palette.surface}>
        <Subject />
        <Halftone color={palette.accent} cellPx={width * 0.022} dotShare={0.32} angle={200} />
      </Quarter>
      <Quarter left={quarter.width} top={quarter.height} {...quarter} label="blobs" color={palette.ink}>
        <div style={{ ...fill, backgroundColor: palette.background }} />
        <Blobs colors={[palette.highlight, palette.accent, palette.accentAlt]} {...quarter} />
      </Quarter>
    </div>
  );
}

export function PortraitHudDemo({ look, width, height }: DemoProps) {
  const { palette, tempo } = look;
  const face = { x: width * 0.24, y: height * 0.12, w: width * 0.52, h: height * 0.3 };

  return (
    <div style={fill}>
      <Subject style={{ filter: "grayscale(1) contrast(1.15)" }} />
      <div style={{ ...fill, backgroundColor: palette.accent, mixBlendMode: "color", opacity: 0.55 }} />
      <Halftone color={palette.ink} cellPx={width * 0.02} dotShare={0.3} angle={20} />
      <CornerBrackets
        rect={face}
        atMs={500}
        tempo={tempo}
        color={palette.highlight}
        armPx={width * 0.08}
        widthPx={width * 0.012}
      />
    </div>
  );
}

function Subject({ style }: { style?: CSSProperties }) {
  return (
    <Img
      src={staticFile(subject)}
      style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", ...style }}
    />
  );
}

function Popped({
  atMs,
  look,
  style,
  children,
}: {
  atMs: number;
  look: DemoProps["look"];
  style?: CSSProperties;
  children: ReactNode;
}) {
  const pose = poseAt(useMs(), { enter: "pop", atMs }, look.tempo);
  if (!pose) return null;

  return <div style={{ ...style, opacity: pose.opacity, transform: `scale(${pose.scale})` }}>{children}</div>;
}

function Quarter(props: {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  color: string;
  children: ReactNode;
}) {
  const { left, top, width, height, label, color, children } = props;

  return (
    <div style={{ position: "absolute", left, top, width, height, overflow: "hidden" }}>
      {children}
      <div style={{ position: "absolute", left: 12, bottom: 10, fontSize: 18, fontWeight: 800, color }}>
        {label}
      </div>
    </div>
  );
}

function pillStyle(width: number, color: string, text: string): CSSProperties {
  return {
    padding: `${width * 0.025}px ${width * 0.07}px`,
    borderRadius: 999,
    backgroundColor: color,
    color: text,
    fontSize: width * 0.1,
    fontWeight: 900,
  };
}

function labelRowStyle(at: { x: number; y: number }, width: number): CSSProperties {
  return {
    position: "absolute",
    left: at.x,
    top: at.y,
    display: "flex",
    alignItems: "center",
    gap: width * 0.025,
  };
}

function badge(width: number, color: string, text: string): CSSProperties {
  const size = width * 0.09;

  return {
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor: color,
    color: text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.55,
    fontWeight: 900,
  };
}

function labelTextStyle(width: number, color: string): CSSProperties {
  return {
    fontSize: width * 0.06,
    fontWeight: 900,
    color,
    textShadow: "0 2px 12px rgba(0,0,0,0.5)",
  };
}

function headlineStyle(width: number, height: number, color: string): CSSProperties {
  return {
    position: "absolute",
    top: height * 0.34,
    width: "100%",
    textAlign: "center",
    fontSize: width * 0.09,
    fontWeight: 800,
    color,
  };
}

function tagStyle(width: number, color: string, text: string): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color,
    color: text,
    fontSize: width * 0.09,
    fontWeight: 900,
    borderRadius: width * 0.02,
    transform: "rotate(-3deg)",
    boxShadow: `${width * 0.012}px ${width * 0.012}px 0 ${text}`,
  };
}

function card(width: number, height: number, color: string): CSSProperties {
  return {
    position: "absolute",
    left: width * 0.1,
    top: height * 0.34,
    width: width * 0.8,
    height: height * 0.32,
    borderRadius: width * 0.04,
    backgroundColor: color,
    boxShadow: "0 24px 60px rgba(10,10,20,0.18)",
  };
}

function cardTitleStyle(left: number, width: number, height: number, color: string): CSSProperties {
  return {
    position: "absolute",
    left,
    top: height * 0.4,
    fontSize: width * 0.065,
    fontWeight: 800,
    color,
  };
}

function buttonStyle(
  rect: { x: number; y: number; w: number; h: number },
  color: string,
  text: string,
  width: number,
): CSSProperties {
  return {
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    borderRadius: 999,
    backgroundColor: color,
    color: text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: width * 0.06,
    fontWeight: 800,
  };
}
