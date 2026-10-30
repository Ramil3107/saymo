# Spike results

Stage 0 measurements: how much time and money each pipeline step takes and how the videos look. They decide the transcription provider, the face detection approach and the models for the director and vision (stage 0 in section 13 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design)).

## Five runs

Three footage files from the owner and two texts:

1. Interview with a face on camera, 2–5 minutes, 16:9.
2. Screen recording with voice, 1–3 minutes.
3. Vertical phone footage, 1–2 minutes.
4. Text: a new feature launch.
5. Text: a sale.

Some runs are repeated with the other transcription provider or another model to compare them. Each repeat is its own row.

## How to read the table

The `spike` skill adds a row from `runs/<id>/metrics.json`. The owner sets the eyeball score and writes the notes. The parentheses in a header list what goes into the cell: `s` is seconds and `$` is dollars.

## Measurements

| Run | Input | Destination | Transcription (provider, s, $) | Vision (frames, s, $) | Director (model, tokens, s, $) | Build (s) | Render (where, s, $) | Total (s, $) | Eyeball score 1–5 | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | text: a product launch, `runs/20261030-1310-saymo-turns-your-raw-phone-foota` | reels | — | — | claude-opus-5-5, 128 in / 2 682 out, 29.1 s, $0.071 | 0.0 | local, 6.4 s, $0 | 35.5 s, $0.071 | [owner] | [owner] |
