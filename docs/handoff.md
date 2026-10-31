# Handoff

Where the work stands on 2026-10-31 and how to pick it up in a new session.

## State

- Branch `stage-0`, everything committed, nothing pushed.
- The vocabulary iteration has steps 1 to 7 built, see "Order of work" in [Vocabulary](./vocabulary.md). Accents and the local director came last.
- The final runs are done: four free stock clips and four text-only ads, the videos in `runs/final/`, the runs in `runs/final-*`, the stock sources in `runs/stock/` (all local, `runs/` is not in git). Paid services cost $0.09 in all.
- The director and the frame notes are written in the session: `pnpm spike` stops with exit code 3 and a brief, the plan goes in `director/plan.json` or the notes in `see/frames.json`, then the same command with `--resume`. `--redo <step>` reruns from a step. See [Pipeline](./pipeline.md).
- Biome, the type check and 295 tests are green.

## Open decision

Where variety across videos starts: compositions and color (recommended), styles first, or one reference at a time. The findings and the three options are under "Variety across videos" in [Vocabulary](./vocabulary.md). The owner has not chosen yet; this is the first question of the next session.

The rule proposed by the learning of 2026-10-31 in [Learnings](./learnings.md) (a contact sheet of a set of videos before they are shown, in the `spike` skill) waits for the owner's yes and goes in with the variety plan.

## Backlog

- Media in the document: photos and collage named in the plan.
- The sound-effect layer and music tracks; the videos are silent now.
- A list made for the backdrop; a card cropped to the subject instead of the whole frame.
- QA warnings fed back to the director; captions that keep clear of text burned into the source.
- The director model: Opus against Sonnet through the API, paid, so only with the owner's go-ahead.
- The owner's three asks in `docs/product/05-open-questions.md`: one video cut from several sources, placement around any detected object, generated backgrounds.

## Prompt for the new session

```
Read CLAUDE.md, docs/handoff.md and the "Variety across videos" section of docs/vocabulary.md.
We continue the vocabulary iteration with variety across videos. Look at runs/final/text-contact-sheet.jpg,
then ask me the open decision from the handoff with your recommendation, one question, in Russian.
After I answer, record the decision, write a short plan for the first step and start it.
```
