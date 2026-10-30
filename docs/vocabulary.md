# Vocabulary

Summary of section 6 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

The vocabulary is a set of React components on Remotion that take their parameters from the video document. A scene is a composition of primitives, not a template with fields. The model picks words from the vocabulary and the engine assembles the frame.

## Minimum for the first version

| Category | Primitives |
| --- | --- |
| Footage | trimmed video clip, background footage, image, logo, shape, Lottie |
| Camera | push, punch-in, pan, parallax over an image or screenshot |
| Text | headline, subheading, big number with a counter, quote, lower third, chip (paper pill sized to its text, optional badge such as Fe or 01, pops in with a blur and floats), sticker, title-card (section label and a big title on a dark panel), list (title and numbered items on a dark side panel) |
| Captions | rail (a short phrase whose words appear as they are said, keywords in the accent color, a scrim below), karaoke, box and pop styles |
| Enters and exits | fade, slide, mask, by word, by letter, typewriter |
| Accents | marker, underline, ring, pulse, shake, flash |
| Transitions | cut, fade, slide, wipe, push |
| Backgrounds | color, gradient, brand, blurred footage |
| Audio | music ducked under the voice, voice, loudness normalization |
| Layout | per beat: free (chips float beside the subject in slots with keep-out zones), panel-top (a title card over the top 46%, the footage zooms and slides so the face sits below), panel-side (a list over one side, the face moves to the other); over a document or screen card the top panel is a short title strip and a headline becomes that strip; safe zones per destination with a 4% gutter |

## Where primitives come from

- GSAP with all plugins: free since 2025, and its timeline can be seeked to a frame inside Remotion.
- Remotion packages: transitions, captions, shapes, paths, lottie, layout-utils, google-fonts.
- Remocn (MIT) and techniques from the author's `video-editing` project.
- Third-party code is ported into the vocabulary under our schema, never plugged in as is.

External assets come only with permissive licenses, and a license manifest lives in the repository: Lucide icons, open illustrations, Lottie under the Lottie Simple License. There is no stock footage in the first version, so backgrounds in text mode are built from the brand, gradients, shapes and images from the link.

## Catalog

The catalog is an internal page where every primitive plays in every register and format. It is the map of the vocabulary, the base for visual tests and later a public showcase. A new primitive without a catalog card is not done. The catalog does not exist yet and arrives in stage 1.

The watermark for the Free plan is also a primitive. Its design is up to the owner.

## Next iteration: the vocabulary base

The reference is the hand-made Synevo reel in `video-editing/synevo` (HyperFrames and GSAP, `project/index.html` and `project_v3`). The design spike reached its family on `runs/face-v2`; what the reference still has and the vocabulary does not:

- Typography: a brand font with weights 600–900, a size scale per element, line spacing; fonts self-hosted.
- Icons and symbols: badge icons in chips, animated SVG symbols (a crossed wheat, a red cross) with stroke reveals and a shake.
- Accent cards: a pull-quote card with a marker highlight, a ring pulse and a shine.
- Status plate: a lower third with status pills ("strict · lifelong").
- Document camera: a camera that moves over a document in a card with highlighted rows.
- Intro title: two masked lines with the subject cut out in front, needs background removal.
- B-roll inserts with a slow zoom, and music ducked under the voice.
- A catalog (Storybook-like) that shows every element in every register and format, with the director's prompt generated from it.
- Caption styles beyond the rail: a line-level box, and the owner's note that word-per-box looks odd.

Each step is checked on the same run: delete `video.json`, `qa.json`, `render.json` and `out.mp4` in `runs/face-v2`, then `pnpm spike runs/inputs/face.mp4 --run face-v2 --resume --render local`, and compare frames with the reference reel.
