import type { ComponentType } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FontsLoaded } from "../FontsLoaded";
import { msToFrame } from "../frames";
import { type DemoProps, glideLook, type Look, snapLook } from "./looks";

export type Demo = { title: string; component: ComponentType<DemoProps>; durationMs: number };

const panel = { width: 540, height: 960, top: 92, gap: 80 };
const labWidth = 1920;
const labHeight = 1080;
const labBackground = "#101014";

export const labSize = { width: labWidth, height: labHeight };

export function labFrames(demos: Demo[]): number {
  return msToFrame(startOf(demos, demos.length));
}

export function LabReel({ demos }: { demos: Demo[] }) {
  return (
    <FontsLoaded>
      <AbsoluteFill style={{ backgroundColor: labBackground }}>
        {demos.map((demo, index) => (
          <Sequence
            key={demo.title}
            from={msToFrame(startOf(demos, index))}
            durationInFrames={msToFrame(demo.durationMs)}
          >
            <Header title={`${index + 1} · ${demo.title}`} />
            <Panel look={snapLook} left={labWidth / 2 - panel.gap / 2 - panel.width} demo={demo} />
            <Panel look={glideLook} left={labWidth / 2 + panel.gap / 2} demo={demo} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </FontsLoaded>
  );
}

function startOf(demos: Demo[], index: number): number {
  return demos.slice(0, index).reduce((total, demo) => total + demo.durationMs, 0);
}

function Header({ title }: { title: string }) {
  return (
    <div style={{ position: "absolute", top: 26, width: "100%", textAlign: "center", ...labText(30, 0.92) }}>
      {title}
    </div>
  );
}

function Panel({ look, left, demo }: { look: Look; left: number; demo: Demo }) {
  const Component = demo.component;

  return (
    <>
      <div style={{ position: "absolute", left, top: panel.top - 30, ...labText(18, 0.6) }}>{look.name}</div>
      <div
        style={{
          ...look.backdrop,
          position: "absolute",
          left,
          top: panel.top,
          width: panel.width,
          height: panel.height,
          borderRadius: 20,
          overflow: "hidden",
          fontFamily: look.fontFamily,
        }}
      >
        <Component look={look} width={panel.width} height={panel.height} />
      </div>
    </>
  );
}

function labText(fontSize: number, opacity: number) {
  return { fontFamily: "Helvetica, Arial, sans-serif", fontSize, fontWeight: 600, color: "white", opacity };
}
