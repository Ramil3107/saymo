import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { destinations } from "../destinations";
import { registers } from "../registers";
import type { Element, Scene, VideoDoc } from "../schema/video";
import { loadBrandFont } from "./fonts";
import { sceneFrames } from "./frames";
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

export function SaymoVideo(doc: VideoDoc) {
  const { fontFamily } = loadBrandFont(doc.brand.font);
  const theme: Theme = { brand: doc.brand, register: registers[doc.register], fontFamily };
  const safeZone = destinations[doc.destination].safeZone;
  const musicSrc = doc.music ? assetSrc(doc, doc.music.assetId) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: doc.brand.colors[0], fontFamily }}>
      {doc.scenes.map((scene) => (
        <Sequence key={scene.id} {...sceneFrames(scene)}>
          <SceneView scene={scene} doc={doc} theme={theme} />
        </Sequence>
      ))}
      {doc.captions ? <Captions captions={doc.captions} theme={theme} safeZone={safeZone} /> : null}
      {doc.music && musicSrc ? <MusicTrack music={doc.music} src={musicSrc} /> : null}
      {doc.voice.map((voice) => {
        const src = assetSrc(doc, voice.assetId);
        return src ? <VoiceTrack key={voice.assetId} voice={voice} src={src} /> : null;
      })}
    </AbsoluteFill>
  );
}

function SceneView({ scene, doc, theme }: { scene: Scene; doc: VideoDoc; theme: Theme }) {
  const { width, height } = useVideoConfig();
  const frame: Frame = { width, height };
  const footageAsset = scene.footage ? findAsset(doc, scene.footage.assetId) : undefined;

  return (
    <AbsoluteFill>
      <Background background={scene.background} theme={theme} />
      <Camera camera={scene.camera} durationMs={scene.durationMs}>
        {scene.footage && footageAsset ? (
          <Footage footage={scene.footage} asset={footageAsset} durationMs={scene.durationMs} />
        ) : null}
        {scene.elements.map((element) => (
          <ElementView key={element.id} element={element} theme={theme} frame={frame} />
        ))}
      </Camera>
    </AbsoluteFill>
  );
}

function ElementView({ element, theme, frame }: { element: Element; theme: Theme; frame: Frame }) {
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

function findAsset(doc: VideoDoc, id: string) {
  return doc.assets.find((asset) => asset.id === id);
}

function assetSrc(doc: VideoDoc, id: string): string | undefined {
  const src = findAsset(doc, id)?.src;
  return src ? assetUrl(src) : undefined;
}

function assetUrl(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `/${src.replace(/^\/+/, "")}`;
}
