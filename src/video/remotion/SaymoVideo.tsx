import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { destinations } from "../destinations";
import { registers } from "../registers";
import type { Element, Scene, VideoDoc } from "../schema/video";
import { loadBrandFont } from "./fonts";
import { msToFrame } from "./frames";
import { Background } from "./primitives/Background";
import { BigNumber } from "./primitives/BigNumber";
import { Camera } from "./primitives/Camera";
import { Captions } from "./primitives/Captions";
import { Chip } from "./primitives/Chip";
import { Footage } from "./primitives/Footage";
import { Headline } from "./primitives/Headline";
import { LowerThird } from "./primitives/LowerThird";
import { MusicTrack } from "./primitives/MusicTrack";
import { Quote } from "./primitives/Quote";
import { Sticker } from "./primitives/Sticker";
import { VoiceTrack } from "./primitives/VoiceTrack";
import type { Frame, Theme } from "./theme";

const assetUrl = (src: string) =>
  /^https?:\/\//.test(src) ? src : `/${src.replace(/^\/+/, "")}`;

function ElementView({
  element,
  theme,
  frame,
}: {
  element: Element;
  theme: Theme;
  frame: Frame;
}) {
  switch (element.kind) {
    case "headline":
      return <Headline element={element} theme={theme} frame={frame} />;
    case "chip":
      return <Chip element={element} theme={theme} frame={frame} />;
    case "big-number":
      return <BigNumber element={element} theme={theme} frame={frame} />;
    case "lower-third":
      return <LowerThird element={element} theme={theme} frame={frame} />;
    case "quote":
      return <Quote element={element} theme={theme} frame={frame} />;
    case "sticker":
      return <Sticker element={element} theme={theme} frame={frame} />;
  }
}

function SceneView({
  scene,
  doc,
  theme,
}: {
  scene: Scene;
  doc: VideoDoc;
  theme: Theme;
}) {
  const { width, height } = useVideoConfig();
  const frame = { width, height };
  const asset = scene.footage
    ? doc.assets.find((a) => a.id === scene.footage?.assetId)
    : undefined;
  return (
    <AbsoluteFill>
      <Background background={scene.background} theme={theme} />
      <Camera camera={scene.camera} durationMs={scene.durationMs}>
        {scene.footage && asset ? (
          <Footage
            footage={scene.footage}
            asset={asset}
            durationMs={scene.durationMs}
          />
        ) : null}
        {scene.elements.map((element) => (
          <ElementView
            key={element.id}
            element={element}
            theme={theme}
            frame={frame}
          />
        ))}
      </Camera>
    </AbsoluteFill>
  );
}

export const SaymoVideo = (doc: VideoDoc) => {
  const { fontFamily } = loadBrandFont(doc.brand.font);
  const theme: Theme = {
    brand: doc.brand,
    register: registers[doc.register],
    fontFamily,
  };
  const safeZone = destinations[doc.destination].safeZone;
  const assetSrc = (id: string) => {
    const src = doc.assets.find((a) => a.id === id)?.src;
    return src ? assetUrl(src) : undefined;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: doc.brand.colors[0], fontFamily }}>
      {doc.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={msToFrame(scene.startMs)}
          durationInFrames={msToFrame(scene.durationMs)}
        >
          <SceneView scene={scene} doc={doc} theme={theme} />
        </Sequence>
      ))}
      {doc.captions ? (
        <Captions captions={doc.captions} theme={theme} safeZone={safeZone} />
      ) : null}
      {doc.music && assetSrc(doc.music.assetId) ? (
        <MusicTrack
          music={doc.music}
          src={assetSrc(doc.music.assetId) as string}
        />
      ) : null}
      {doc.voice.map((voice) => {
        const src = assetSrc(voice.assetId);
        return src ? (
          <VoiceTrack key={voice.assetId} voice={voice} src={src} />
        ) : null;
      })}
    </AbsoluteFill>
  );
};
