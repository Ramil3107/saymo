# Video schema

Summary of section 5 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design). Field tables will be added together with the Zod schemas in `src/video/schema/`.

A video is a JSON document that follows our schema. This is the main architectural decision: the model does not write code, it returns data, and the engine executes it.

## What the document holds

- destination and format, frame rate, duration;
- brand;
- assets: source video, proxy, audio, images, logo;
- tracks: footage with trims, scenes with elements, camera, captions, music, voice.

Every element has a stable id, a type from the vocabulary, parameters and timing.

## Schema rules

- The Zod schema is the single source of truth: TypeScript types and the JSON schema for the model are derived from it.
- Every model output is validated, and invalid output is never applied.
- A document changes only through a list of operations: set, remove, insert, move, trim, retime, restyle. Operations are pure, with no side effects.
- Every edit creates a new version: a full snapshot plus the operations that produced it. Undo goes back to the previous version.
- Beat and element ids stay stable across rebuilds. The plan issues them, not the build.
- Style decisions (music, caption style, register, fonts, colors) sit in a separate section of the document and survive any rebuild.
- Any element can be selected with a click: the engine puts the element id into the DOM.
- The layout for 9:16, 1:1 and 16:9 is computed from the document deterministically, so the format does not store three copies.

## Registers

A register is the character of a video. It sets timings, curves, staggers, font weights and the number of elements in a scene. It has three axes: energy, tone and density. The presets are `driving-launch`, `serious-clinical`, `rich-premium` and `playful-sale`. The vocabulary reads the register and QA checks it.

The exact set of fields is left to the builder; the constraints above are mandatory.
