---
name: spike
description: Run the spike on a video or text and record the measurements in the table. Call when the pipeline needs checking or providers and models need comparing.
---

1. If not stated, ask for the input (a path to a video, or text) and the destination.
2. Run `pnpm spike <path or --text> --to <destination> [--director local|api] [--vision local|api] [--transcriber elevenlabs|deepgram] [--render local|lambda|none]`. The director and the frame descriptions are local by default: the run stops with a brief in `runs/<id>/vision/` (describe the listed keyframes into `frames.json`) and then in `runs/<id>/director/` (write `plan.json` from `prompt.md` and `schema.json`); rerun with the same arguments and `--resume --run <id>` after each. Read QA's `overlay-left-out` warnings and revise the plan with `--redo direct`. Use `--director api` or `--vision api` only when the service itself is measured, and tell the owner the cost before the run.
3. After the run, append a row to the table in `docs/spike-results.md` from `runs/<id>/metrics.json`. Ask the owner for the eyeball score and the notes, do not fill them in yourself.
