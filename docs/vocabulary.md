# Vocabulary

Summary of section 6 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

The vocabulary is a set of React components on Remotion that take their parameters from the video document. A scene is a composition of primitives, not a template with fields. The model picks words from the vocabulary and the engine assembles the frame.

## Minimum for the first version

| Category | Primitives |
| --- | --- |
| Footage | trimmed video clip, background footage, image, logo, shape, Lottie |
| Camera | push, punch-in, pan, parallax over an image or screenshot |
| Text | headline, subheading, big number with a counter, quote, lower third, chip, step list, sticker |
| Captions | karaoke, box and pop styles, position, highlight of the current word |
| Enters and exits | fade, slide, mask, by word, by letter, typewriter |
| Accents | marker, underline, ring, pulse, shake, flash |
| Transitions | cut, fade, slide, wipe, push |
| Backgrounds | color, gradient, brand, blurred footage |
| Audio | music ducked under the voice, voice, loudness normalization |
| Layout | slots around the person with keep-out zones, grids, safe zones per destination |

## Where primitives come from

- GSAP with all plugins: free since 2025, and its timeline can be seeked to a frame inside Remotion.
- Remotion packages: transitions, captions, shapes, paths, lottie, layout-utils, google-fonts.
- Remocn (MIT) and techniques from the author's `video-editing` project.
- Third-party code is ported into the vocabulary under our schema, never plugged in as is.

External assets come only with permissive licenses, and a license manifest lives in the repository: Lucide icons, open illustrations, Lottie under the Lottie Simple License. There is no stock footage in the first version, so backgrounds in text mode are built from the brand, gradients, shapes and images from the link.

## Catalog

The catalog is an internal page where every primitive plays in every register and format. It is the map of the vocabulary, the base for visual tests and later a public showcase. A new primitive without a catalog card is not done. The catalog does not exist yet and arrives in stage 1.

The watermark for the Free plan is also a primitive. Its design is up to the owner.
