# Handoff

Where the work stands on 2026-11-01 and how to pick it up in a new session.

## State

- Branch `main` on [github.com/Ramil3107/saymo](https://github.com/Ramil3107/saymo), a public repository; work since the scaffold, the font library included, is merged into it and pushed.
- The vocabulary iteration has steps 1 to 7 built, see "Order of work" in [Vocabulary](./vocabulary.md). Accents and the local director came last.
- The final runs are done: four free stock clips and four text-only ads, the videos in `runs/final/`, the runs in `runs/final-*`, the stock sources in `runs/stock/` (all local, `runs/` is not in git). Paid services cost $0.09 in all.
- The director and the frame notes are written in the session: `pnpm spike` stops with exit code 3 and a brief, the plan goes in `director/plan.json` or the notes in `see/frames.json`, then the same command with `--resume`. `--redo <step>` reruns from a step. See [Pipeline](./pipeline.md).
- Biome, the type check and the tests are green.
- Fonts come from the library in `public/fonts` (40 OFL families, 2026-11-01, see "Fonts" in [Vocabulary](./vocabulary.md)); no render fetches Google Fonts any more. The Lambda site `saymo` still holds the old bundle: redeploy it (`npx remotion lambda sites create src/video/remotion/index.ts --site-name=saymo`, see the [Lambda runbook](./runbooks/lambda.md)) before Lambda renders pick up the fonts.

## Next

Variety across videos, starting with compositions and color: the owner chose it on 2026-10-31. The plan is under "Variety across videos" in [Vocabulary](./vocabulary.md). Step 1, the first five composition families, was accepted by the owner on 2026-11-01: the lab in `runs/composition-lab/` (both styles, `sheet.jpg`) and the four text-only ads planned again in `runs/variety-text/` (`before-after.jpg` beside the old contact sheet). On the owner's first look the cropped number read as a defect, so `edge-number` became `giant-number`, whole in the frame. Step 2 was built on 2026-11-01 and waits for the owner's look: palettes for videos without a brand (eight, five per style, named in the plan) and five more families, `bands`, `diagonal`, `inset`, `corner-stack` and `echo`. The lab is in `runs/composition-lab-2/` (both styles, `sheet-new.jpg` holds the ten new beats); the four text-only ads were planned again with the new families, each in its own palette (knit flamingo, ledger forest, dental ocean, bakery tangerine), in `runs/variety-text/`, with `contact-sheet-step2.jpg` beside the step 1 sheet and the step 1 runs kept in `runs/variety-text/step1/`. Step 3, new backgrounds and a camera over the backdrop, comes after the owner's yes.

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
