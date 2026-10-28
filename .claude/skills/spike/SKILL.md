---
name: spike
description: Run the spike on a video or text and record the measurements in the table. Call when the pipeline needs checking or providers and models need comparing.
---

1. If not stated, ask for the input (a path to a video, or text) and the destination.
2. Run `pnpm spike <path or --text> --to <destination> [--transcriber elevenlabs|deepgram] [--render local|lambda|none]`.
3. After the run, append a row to the table in `docs/spike-results.md` from `runs/<id>/metrics.json`. Ask the owner for the eyeball score and the notes, do not fill them in yourself.
