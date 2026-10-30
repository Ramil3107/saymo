import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { destinations, formatSize } from "../destinations";
import { registers } from "../registers";
import type { Element, Scene, VideoDoc } from "../schema/video";
import { defaultStyle } from "../styles";
import { CaptionLayer } from "./captions/CaptionLayer";
import { loadBrandFont } from "./fonts";
import { sceneFrames } from "./frames";
import { SceneTransition, type TransitionColors } from "./motion/SceneTransition";
import { Background } from "./primitives/Background";
import { BigNumber } from "./primitives/BigNumber";
import { Camera } from "./primitives/Camera";
import { Chip } from "./primitives/Chip";
import { Footage } from "./primitives/Footage";
import { Headline } from "./primitives/Headline";
import { CornerElement, CounterElement, type Surface, TitleElement } from "./primitives/Kinetic";
import { ListPanel } from "./primitives/ListPanel";
import { LowerThird } from "./primitives/LowerThird";
import { MusicTrack } from "./primitives/MusicTrack";
import { Quote } from "./primitives/Quote";
import { Sticker } from "./primitives/Sticker";
import { TitleCard } from "./primitives/TitleCard";
import { VoiceTrack } from "./primitives/VoiceTrack";
import { styleKit } from "./style/kit";
import { accentColor, darken, type Frame, panelColor, type Theme, white } from "./theme";

export function SaymoVideo(doc: VideoDoc) {
  const theme = themeFor(doc);
  const { fontFamily, safeZone } = theme;
  const musicSrc = doc.music ? assetSrc(doc, doc.music.assetId) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: doc.brand.colors[0], fontFamily }}>
      <Scenes doc={doc} theme={theme} />
      {doc.captions ? (
        <CaptionLayer
          captions={doc.captions}
          theme={theme}
          safeZone={safeZone}
          frame={formatSize(doc.format)}
        />
      ) : null}
      {doc.music && musicSrc ? <MusicTrack music={doc.music} src={musicSrc} /> : null}
      {doc.voice.map((voice) => {
        const src = assetSrc(doc, voice.assetId);
        return src ? <VoiceTrack key={voice.assetId} voice={voice} src={src} /> : null;
      })}
    </AbsoluteFill>
  );
}

function themeFor(doc: VideoDoc): Theme {
  const kit = styleKit(doc.style ?? defaultStyle[doc.register], doc.brand);

  return {
    brand: doc.brand,
    register: registers[doc.register],
    tempo: kit.tempo,
    kit,
    fontFamily: loadBrandFont(doc.brand.font).fontFamily,
    safeZone: destinations[doc.destination].safeZone,
  };
}

function Scenes({ doc, theme }: { doc: VideoDoc; theme: Theme }) {
  return (
    <>
      {doc.scenes.map((scene, index) => (
        <Sequence key={scene.id} {...sceneFrames(scene)}>
          <SceneTransition
            into={scene.transition}
            outof={doc.scenes[index + 1]?.transition ?? "cut"}
            durationMs={scene.durationMs}
            tempo={theme.tempo}
            width={formatSize(doc.format).width}
            colors={transitionColors(theme)}
          >
            <SceneView scene={scene} doc={doc} theme={theme} />
          </SceneTransition>
        </Sequence>
      ))}
    </>
  );
}

function SceneView({ scene, doc, theme }: { scene: Scene; doc: VideoDoc; theme: Theme }) {
  const { width, height } = useVideoConfig();
  const frame: Frame = { width, height };
  const footageAsset = scene.footage ? findAsset(doc, scene.footage.assetId) : undefined;

  return (
    <AbsoluteFill>
      <Background background={scene.background} theme={theme} frame={frame} />
      <Camera camera={scene.camera} durationMs={scene.durationMs}>
        {scene.footage && footageAsset ? (
          <Footage footage={scene.footage} asset={footageAsset} durationMs={scene.durationMs} theme={theme} />
        ) : null}
      </Camera>
      {scene.elements.map((element) => (
        <ElementView
          key={element.id}
          element={element}
          theme={theme}
          frame={frame}
          surface={scene.background.kind === "style" ? "backdrop" : "footage"}
        />
      ))}
    </AbsoluteFill>
  );
}

function ElementView(props: { element: Element; theme: Theme; frame: Frame; surface: Surface }) {
  const { element, theme, frame, surface } = props;

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
    case "title-card":
      return <TitleCard element={element} theme={theme} frame={frame} />;
    case "list":
      return <ListPanel element={element} theme={theme} frame={frame} />;
    case "title":
      return <TitleElement element={element} theme={theme} frame={frame} surface={surface} />;
    case "counter":
      return <CounterElement element={element} theme={theme} frame={frame} surface={surface} />;
    case "corner-label":
      return <CornerElement element={element} theme={theme} frame={frame} surface={surface} />;
  }
}

function transitionColors(theme: Theme): TransitionColors {
  return {
    flash: white,
    dip: darken(theme.brand.colors[0] ?? "#0D1D42", 0.75),
    panel: panelColor(theme),
    edge: accentColor(theme),
  };
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
