# Video schema

Summary of section 5 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design). The Zod schemas live in `src/video/schema/`, and the tables below follow them.

A video is a JSON document that follows our schema. This is the main architectural decision: the model does not write code, it returns data, and the engine executes it.

## What the document holds

- destination and format, frame rate, duration;
- brand;
- assets: source video, proxy, audio, images, logo;
- tracks: footage with trims, scenes with elements, camera, captions, music, voice.

Every element has a stable id, a type from the vocabulary, parameters and timing.

## Document fields

`VideoDocSchema` in `src/video/schema/video.ts`. All times are in milliseconds.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Id of the document |
| `format` | `9:16`, `1:1` or `16:9` | Aspect ratio of the frame, the size in pixels is in [Destinations](#destinations) |
| `fps` | `30` | Frame rate, always 30 |
| `durationMs` | number | Length of the video, the last scene ends here |
| `destination` | destination id | Where the video goes, see [Destinations](#destinations) |
| `register` | register id | Character of the video, see [Registers](#registers) |
| `brand` | object | `colors` (one to three), `font` and an optional `logo` |
| `assets` | list | `id`, `kind` (`video`, `audio` or `image`), `src` and an optional `durationMs`. Scenes, music and voice refer to assets by `id` |
| `scenes` | list of scenes | In order, with no gaps or overlaps: the first starts at 0, each next one starts where the previous one ends |
| `captions` | object, optional | `style` (`rail`, `karaoke`, `box` or `pop`), `keywords` (words shown in the accent color) and `pages`. A page has `text`, `startMs`, `durationMs` and `tokens`: words with their own `fromMs` and `toMs` |
| `music` | object, optional | `assetId`, `volume`, `duckTo` (the volume under speech) and `speech`, the intervals where the music ducks |
| `voice` | list | `assetId` and `atMs`, the moment a voiceover clip starts |

Fields of a scene:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable id, the same as the id of the beat the scene comes from |
| `startMs`, `durationMs` | number | Position on the timeline of the video |
| `background` | object | `kind` (`brand`, `solid` or `gradient`) and an optional `color` |
| `footage` | object, optional | `assetId`, `fromMs` in the source video and `transform` (`scale`, `x`, `y`) |
| `camera` | object, optional | `kind` (`none`, `push`, `punch-in` or `pan`) and `intensity` from 0 to 1 |
| `elements` | list | The elements of the scene |
| `transition` | `cut`, `fade` or `slide` | Transition of the scene |

## Elements

An element is one of six kinds, picked by `kind`. Every element has an `id`, `enterMs` and `exitMs` (counted from the start of its scene), a `box` and an optional `emphasis` (`marker`, `underline` or `pulse`). The `box` is a rectangle `x`, `y`, `w`, `h` in fractions of the frame, from 0 to 1. On top of that:

- `headline`: `text` and an optional `sub`;
- `chip`: `text`;
- `big-number`: `value` and an optional `label`;
- `lower-third`: `name` and an optional `role`;
- `quote`: `text` and an optional `author`;
- `sticker`: `text`.
- `title-card`: `text` and an optional `sub` used as the section label; it fills the top panel of a `panel-top` beat.
- `list`: `text` as the title and `items`; it fills the side panel of a `panel-side` beat.

## Schema rules

- The Zod schema is the single source of truth: TypeScript types and the JSON schema for the model are derived from it.
- Every model output is validated, and invalid output is never applied.
- A document changes only through a list of operations: set, remove, insert, move, trim, retime, restyle. Operations are pure, with no side effects.
- Every edit creates a new version: a full snapshot plus the operations that produced it. Undo goes back to the previous version.
- Beat and element ids stay stable across rebuilds. The plan issues them, not the build.
- Style decisions (music, caption style, register, fonts, colors) sit in a separate section of the document and survive any rebuild.
- Any element can be selected with a click: the engine puts the element id into the DOM.
- The layout for 9:16, 1:1 and 16:9 is computed from the document deterministically, so the format does not store three copies.

## Destinations

A destination sets the format, the length ceiling, the safe zone and whether captions are on by default. The safe zone is the share of the frame, counted from each edge, that stays free of the app interface. `file` is a download for any platform.

| Destination | Format | Max length | Safe zone: top, bottom, left, right | Captions by default |
| --- | --- | --- | --- | --- |
| `reels` | 9:16 | 3 min | 0.14, 0.22, 0.04, 0.14 | yes |
| `stories` | 9:16 | 1 min | 0.14, 0.22, 0.04, 0.14 | yes |
| `shorts` | 9:16 | 3 min | 0.14, 0.22, 0.04, 0.14 | yes |
| `linkedin` | 16:9 | 10 min | 0.05, 0.05, 0.05, 0.05 | yes |
| `youtube` | 16:9 | 10 min | 0.05, 0.05, 0.05, 0.05 | no |
| `file` | 9:16 | 10 min | 0.05, 0.05, 0.05, 0.05 | no |

Frame sizes: 9:16 is 1080×1920, 1:1 is 1080×1080, 16:9 is 1920×1080, all at 30 frames per second.

## Registers

A register is the character of a video. It sets timings, curves, staggers, font weights and the number of elements in a scene. It has three axes: energy, tone and density. The presets are `driving-launch`, `serious-clinical`, `rich-premium` and `playful-sale`. The vocabulary reads the register and QA checks it.

| Register | Scene length, ms | Min hold, ms | Tempo | Font weight | Max elements | Max concurrent motions | Music BPM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `driving-launch` | 1500–2500 | 700 | snap | 800–900 | 4 | 2 | 110–130 |
| `serious-clinical` | 3000–4500 | 1200 | glide | 500–700 | 3 | 1 | 70–90 |
| `rich-premium` | 2500–4000 | 1000 | glide | 600–800 | 5 | 2 | 80–100 |
| `playful-sale` | 1500–2500 | 700 | snap | 800–900 | 6 | 3 | 120–140 |

Min hold is the shortest time something stays on screen. The tempo sets move lengths, staggers and curves; the tempos are described in [Vocabulary](/vocabulary#motion-system). Max concurrent motions is how many things may move at the same moment.

The tables above are the exact fields of the first version. The constraints in the rules above are mandatory.
