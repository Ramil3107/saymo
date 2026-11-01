# Handoff

Where the work stands on 2026-10-31 and how to pick it up in a new session.

## State

- Branch `stage-0`, everything committed, nothing pushed.
- The vocabulary iteration has steps 1 to 7 built, see "Order of work" in [Vocabulary](./vocabulary.md). Accents and the local director came last.
- The final runs are done: four free stock clips and four text-only ads, the videos in `runs/final/`, the runs in `runs/final-*`, the stock sources in `runs/stock/` (all local, `runs/` is not in git). Paid services cost $0.09 in all.
- The director and the frame notes are written in the session: `pnpm spike` stops with exit code 3 and a brief, the plan goes in `director/plan.json` or the notes in `see/frames.json`, then the same command with `--resume`. `--redo <step>` reruns from a step. See [Pipeline](./pipeline.md).
- Biome, the type check and the tests are green.
- Fonts come from the library in `public/fonts` (40 OFL families, 2026-11-01, see "Fonts" in [Vocabulary](./vocabulary.md)); no render fetches Google Fonts any more. The Lambda site `saymo` still holds the old bundle: redeploy it (`npx remotion lambda sites create src/video/remotion/index.ts --site-name=saymo`, see the [Lambda runbook](./runbooks/lambda.md)) before Lambda renders pick up the fonts.

## Next

Variety across videos, starting with compositions and color: the owner chose it on 2026-10-31. The plan is under "Variety across videos" in [Vocabulary](./vocabulary.md). Step 1, the first five composition families, is built and waits for the owner's review: the lab in `runs/composition-lab/` (both styles, `sheet.jpg`) and the four text-only ads planned again in `runs/variety-text/` (`before-after.jpg` beside the old contact sheet). Step 2 is next after the review.

The rule proposed by the learning of 2026-10-31 in [Learnings](./learnings.md) (a contact sheet of a set of videos before they are shown, in the `spike` skill) still waits for the owner's yes.

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
We continue variety across videos with the step in progress from the handoff. Check git log and the
working tree for where it stopped, tell me in Russian in two or three lines, then carry on.
```
