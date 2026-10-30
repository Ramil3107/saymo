---
name: vocab
description: Add a primitive to the video vocabulary. Call when the director needs a new frame component.
---

1. Ask for the primitive's name and its parameters.
2. Start from a reference clip the owner likes. Break it down frame by frame: timings, curves, and how elements enter, leave and transform. Add the breakdown to "What the references do" in `docs/vocabulary.md`.
3. Create `src/video/remotion/primitives/<Name>.tsx`. Cadence, overshoot and accent budgets come from the style, not from the primitive. Positions are whole pixels and a resting element has no transform: use `wholePx` and `restingTransform` from `src/video/remotion/motion/pixels.ts`, because renderer tabs and Lambda's browsers round fractional positions differently.
4. Add the Zod schema of the parameters to `src/video/schema/video.ts`.
5. Add a card to the catalog. There is no catalog yet. It arrives in stage 1. Until then, skip this step.
6. Write a test for registers and formats: the primitive works in every register and in every format (9:16, 1:1, 16:9).
7. Render a single frame: `pnpm remotion:still`.
8. Render the primitive in motion with the default concurrency and run `pnpm check:still <video> --from <s> --to <s> --crop w:h:x:y` over a stretch where it stands still. Anything above compression noise is a twitch to fix before the owner sees it.
9. Show the owner a render of the primitive in motion. It joins the vocabulary only after the owner has seen it.
