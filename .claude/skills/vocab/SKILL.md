---
name: vocab
description: Add a primitive to the video vocabulary. Call when the director needs a new frame component.
---

1. Ask for the primitive's name and its parameters.
2. Create `src/video/remotion/primitives/<Name>.tsx`.
3. Add the Zod schema of the parameters to `src/video/schema/video.ts`.
4. Add a card to the catalog. There is no catalog yet. It arrives in stage 1. Until then, skip this step.
5. Write a test for registers and formats: the primitive works in every register and in every format (9:16, 1:1, 16:9).
6. Render a single frame: `pnpm remotion:still`.
