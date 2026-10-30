import { fitText } from "@remotion/layout-utils";
import { Video } from "@remotion/media";
import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import { staggered } from "../../motion/timeline";
import type { Rect } from "../accents/geometry";
import { Collage, tileOf } from "../media/Collage";
import { Flicker } from "../media/Flicker";
import { Flip } from "../media/Flip";
import { FocusCard } from "../media/FocusCard";
import { NamedGrid } from "../media/NamedGrid";
import { PhoneFrame } from "../media/PhoneFrame";
import { ThumbToPlayer } from "../media/ThumbToPlayer";
import { TypeOn } from "../motion/TypeOn";
import type { DemoProps } from "./looks";

const faces = ["face-1.jpg", "face-2.jpg", "face-3.jpg", "face-4.jpg", "face-5.jpg", "subject.jpg"].map(
  (name) => staticFile(name),
);
const footage = staticFile("caption-footage.mp4");
const documentPage = staticFile("document.jpg");
const documentAspect = 540 / 960;
const fill: CSSProperties = { position: "absolute", inset: 0 };

export function StaircaseDemo({ look, width, height }: DemoProps) {
  const area = collageArea(width, height);

  return (
    <div style={fill}>
      <Heading look={look} width={width} height={height} text="BEHIND THE SCENES" />
      <Collage srcs={faces} layout="staircase" area={area} atMs={500} tempo={look.tempo} />
    </div>
  );
}

export function FlickerScatterDemo({ look, width, height }: DemoProps) {
  const { tempo } = look;
  const cuts = tempo.flashMs > 0 ? 10 : 3;
  const flickerMs = (tempo.flashMs > 0 ? tempo.flashMs * 2 : tempo.moveMs * 2) * cuts;

  return (
    <div style={fill}>
      <Flicker srcs={faces} atMs={250} cuts={cuts} tempo={tempo} />
      <Collage
        srcs={faces.slice(0, 4)}
        layout="scatter"
        area={collageArea(width, height)}
        atMs={250 + flickerMs}
        tempo={tempo}
      />
    </div>
  );
}

export function ThumbPlayerDemo({ look, width, height }: DemoProps) {
  const area = collageArea(width, height);
  const grownIndex = 2;
  const thumb = tileOf("staircase", grownIndex, faces.length, area).rect;
  const player = { x: width * 0.05, y: height * 0.14, w: width * 0.9, h: height * 0.64 };

  return (
    <div style={fill}>
      <Collage
        srcs={faces.filter((_, index) => index !== grownIndex)}
        layout="staircase"
        area={area}
        atMs={250}
        tempo={look.tempo}
      />
      <ThumbToPlayer
        src={footage}
        thumb={thumb}
        player={player}
        atMs={1300}
        tempo={look.tempo}
        accent={look.palette.accent}
      />
    </div>
  );
}

export function PhoneDemo({ look, width, height }: DemoProps) {
  const phone = { x: width * 0.22, y: height * 0.24, w: width * 0.56, h: width * 0.56 * 2.05 };

  return (
    <div style={fill}>
      <Heading look={look} width={width} height={height} text="ON EVERY PHONE" />
      <PhoneFrame rect={phone} atMs={400} tempo={look.tempo}>
        <Video
          src={footage}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </PhoneFrame>
    </div>
  );
}

export function NamedGridDemo({ look, width, height }: DemoProps) {
  const labels = ["IRON", "CALCIUM", "B12", "FIBER"];
  const cells = labels.map((label, index) => ({
    src: faces[index] ?? documentPage,
    label,
    namedAtMs: 900 + index * 600,
  }));
  const area = { x: width * 0.05, y: height * 0.14, w: width * 0.9, h: height * 0.66 };

  return (
    <div style={fill}>
      <NamedGrid
        cells={cells}
        columns={2}
        area={area}
        atMs={250}
        tempo={look.tempo}
        accent={look.palette.highlight}
        ink={look.palette.ink}
      />
    </div>
  );
}

export function FocusDocumentDemo({ look, width, height }: DemoProps) {
  const card = { x: width * 0.08, y: height * 0.12, w: width * 0.84, h: height * 0.74 };
  const resultRow = { x: 0.17, y: 0.25, w: 0.46, h: 0.055 };

  return (
    <div style={fill}>
      <FocusCard
        src={documentPage}
        aspect={documentAspect}
        rect={card}
        focus={resultRow}
        atMs={800}
        holdMs={1500}
        tempo={look.tempo}
        accent={look.palette.accent}
      />
    </div>
  );
}

export function FlipRevealDemo({ look, width }: DemoProps) {
  const facts = ["24h", "98%", "1 visit"];
  const size = { w: width * 0.27, h: width * 0.38 };

  return (
    <div
      style={{ ...fill, display: "flex", alignItems: "center", justifyContent: "center", gap: width * 0.03 }}
    >
      {facts.map((fact, index) => (
        <Flip
          key={fact}
          front={
            <Img
              src={faces[index] ?? documentPage}
              style={{ width: size.w, height: size.h, objectFit: "cover", borderRadius: 12 }}
            />
          }
          back={<div style={factStyle(size, look.palette.accent, look.palette.surface, width)}>{fact}</div>}
          atMs={staggered(1000, index, look.tempo.wordMs)}
          tempo={look.tempo}
        />
      ))}
    </div>
  );
}

function Heading({ look, width, height, text }: DemoProps & { text: string }) {
  const fitted = fitText({
    text,
    withinWidth: width * 0.9,
    fontFamily: look.fontFamily,
    fontWeight: 900,
  }).fontSize;

  return (
    <div
      style={{
        position: "absolute",
        top: height * 0.07,
        width: "100%",
        textAlign: "center",
        fontSize: Math.min(width * 0.075, fitted),
        fontWeight: 900,
        color: look.palette.ink,
      }}
    >
      <TypeOn text={text} atMs={250} tempo={look.tempo} />
    </div>
  );
}

function collageArea(width: number, height: number): Rect {
  return { x: width * 0.05, y: height * 0.18, w: width * 0.9, h: height * 0.6 };
}

function factStyle(
  size: { w: number; h: number },
  color: string,
  text: string,
  width: number,
): CSSProperties {
  return {
    width: size.w,
    height: size.h,
    borderRadius: 12,
    backgroundColor: color,
    color: text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: width * 0.065,
    fontWeight: 900,
  };
}
