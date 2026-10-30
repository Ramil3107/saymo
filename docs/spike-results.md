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
| 1 | face on camera: Synevo doctor, 1:49, 464×848, Ukrainian speech, `runs/20261030-1333-face` | reels | elevenlabs, 8.2 s, $0.012 | 55 frames: Rekognition 26.1 s $0.055, Claude Opus 5.5 32.6 s $0.286 | claude-opus-5-5, 3 224 in / 8 290 out, 71.2 s, $0.196 | 0.0 | local, 83.0 s, $0 | 221 s, $0.549 | — | owner: fonts feel off (typography later); word-by-word captions look odd; chip labels at the top are small; line spacing is off; the lab-sheet shot is barely readable with a strange background; captions are not centered |
| 1b | run 1 with Deepgram, `runs/face-deepgram` | reels | deepgram, 2.3 s, $0.014 | 55 frames: Rekognition $0.055, Claude Opus 5.5 $0.29 | claude-opus-5-5, 71 s, $0.20 | 0.0 | none | 139.7 s, $0.567 | — | lead: faster, but Ukrainian spelling slips: «ціліакії», «Без глютенова», «Д» for «D»; word timings within 60 ms of ElevenLabs |
| 1c | run 1 with Sonnet 5.5 for vision, `runs/face-sonnet-vision` | reels | elevenlabs, $0.012 | 55 frames: Rekognition $0.055, Claude Sonnet 5.5 31.1 s $0.147 | claude-opus-5-5, 81 s, $0.20 | 0.0 | none | 143.4 s, $0.415 | — | lead: same face/screen classification and equally useful notes at half the vision cost |
| 1d | run 1 with Sonnet 5.5 as director, `runs/face-sonnet-director` | reels | elevenlabs, $0.012 | 55 frames: Rekognition $0.055, Claude Opus 5.5 $0.28 | claude-sonnet-5-5, 3 085 in / 6 581 out, 45.1 s, $0.081 | 0.0 | local | 103 s, $0.43 | [owner] | lead: cut the talk down to 11 beats and 45 s where Opus kept all 109 s in 27 beats and asked whether to cut; copy is comparable |
| 2 | screen recording: task app on a phone, 39 s, 1206×2622, no speech, `runs/20261030-1337-screen` | reels | — (silent source) | 20 frames: Rekognition 6.4 s $0.020, Claude Opus 5.5 16.9 s $0.128 | claude-opus-5-5, 1 501 in / 2 894 out, 28.1 s, $0.065 | 0.0 | local, 14.4 s, $0 | 65.8 s, $0.212 | — | owner: white on white, nothing readable; chips look odd |
| 3 | vertical phone footage: Ichnya recipe, 59 s, 2160×3840, Ukrainian speech, `runs/20261030-1338-phone` | reels | elevenlabs, 4.3 s, $0.007 | 29 frames: Rekognition 8.4 s $0.029, Claude Opus 5.5 19.6 s $0.156 | claude-opus-5-5, 2 983 in / 6 411 out, 56.3 s, $0.141 | 0.0 | local, 74.9 s, $0 | 163.5 s, $0.332 | — | owner: the 180° count-up is fine; nothing is centered; the caption animation is odd |
| 4 | text: a product launch, `runs/20261030-1310-saymo-turns-your-raw-phone-foota` | reels | — | — | claude-opus-5-5, 128 in / 2 682 out, 29.1 s, $0.071 | 0.0 | local, 6.4 s, $0 | 35.5 s, $0.071 | — | owner: fine for a test |
| 5 | text: a sale, `runs/20261030-1341-black-friday-at-saymo-40-off-the` | reels | — | — | claude-opus-5-5, 133 in / 2 733 out, 33.0 s, $0.056 | 0.0 | local, 5.2 s, $0 | 38.1 s, $0.056 | — | owner: the Hurry sticker sits on the headline; fine for a test otherwise |

Run 1 is vertical and shorter than the interview the plan asked for: the owner had no horizontal interview at hand. Runs 1 and 3 are the owner's own client footage, run 2 is a silent iPhone screen recording. Render is local on a MacBook; Lambda waits for the quotas of the new AWS account.

## What the runs showed

Observations by the lead, before the owner's scores:

- **Cost.** A two-minute talking head costs about $0.55 and 3.7 minutes, of which vision is $0.34 (Rekognition $0.06, Opus descriptions $0.29) and the director $0.20. Text-only runs cost $0.06 and 40 seconds. Vision is the lever: 60 frames through Opus is half the bill.
- **Director.** With continuous speech the director keeps the full source in order (runs 1 and 3) and asks whether to cut it down; with a silent screen recording it cuts 39 s to 16 s by the shots and frame notes (run 2). Copy stays in the language of the speech. One run asked whose name to show in the lower third, a question the plan card is meant for.
- **Faces.** Rekognition found the doctor in 47 of 55 frames and nothing on hands-only food footage. Keep-out zones worked: no element landed on a face.
- **Legibility.** A white headline over the white lab sheet in run 1 is unreadable: elements have no scrim or contrast rule. Long chip texts shrink to a tiny font instead of wrapping. The count-up animation of `big-number` reads "1" for half a second on the way to "2" when the number is a step index.
- **Screen recordings.** Fit-cover crops a phone screen recording and the `big-number` landed on the app's own text: screen footage needs fit-contain and keep-out zones for on-screen text.
- **Captions.** In sync in both languages, box and pop styles; the caption band keeps overlays out.
- **After the owner's review.** Fixed the same day: elements in a scene now keep out of each other (the Hurry sticker had landed on a headline) with a QA error for overlaps; captions and centered elements are centered on the frame instead of the lopsided Reels safe zone; headline text is centered in its box; elements keep a 4% gutter from the safe zone instead of sitting flush against it; text primitives got a soft shadow for bright footage. The build looks faces up over the whole beat, as QA does, because keyframes two seconds apart let a short overlay miss every face sample; an overlay whose best spot still covers more than half of a face is left out. Left for the vocabulary and design stage: typography and line spacing, chip sizing, word-by-word caption styles and their animation, a treatment for document shots.
- **Providers and models.** ElevenLabs Scribe v2 reads Ukrainian medical speech cleanly where Deepgram Nova 3 misspells terms; Deepgram is three times faster at the same price. Sonnet 5.5 describes frames as well as Opus 5.5 at half the cost. As director, Sonnet is twice as cheap and fast and makes a bolder cut; whether its plans are as good is the owner's call from the videos.
