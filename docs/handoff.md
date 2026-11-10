# Handoff

Where the work stands on 2026-11-10 and how to pick it up in a new session.

## State

- The application is built slice by slice around a mock engine (see the decision of 2026-11-09 in [Decisions](./product/decisions.md)). Slice 1, the foundation and sign-in, is built on the branch `app` in the worktree `.claude/worktrees/app`. It is not merged and not pushed. It has the design system, the app's environment and database, email, sign-in with an email link on Better Auth, Sign in and Check your inbox, Home (header only), Account (profile, sign out, deletion), the 404 and error pages, and the end-to-end test (`pnpm e2e`). How it works is in [Architecture](./architecture.md), how to run it in [Setup](./runbooks/setup.md#run-the-app).
- The sign-in email's link opens a page, "One click left.", and only its Sign in to Saymo button signs in, so a mail scanner that opens the link first cannot use it up (the owner's call on 2026-11-10, in [Decisions](./product/decisions.md)).
- Google sign-in works locally. On 2026-11-10 the owner created the Google Cloud project "Saymo", its consent screen (External, still in Testing) and the OAuth client "Saymo local" (origin `http://localhost:3000`, redirect `http://localhost:3000/api/auth/callback/google`); both keys are in the worktree's local `.env`, and the owner signed in with Google and saw "Signed in with Google." on Account. Production needs its own OAuth client for the real domain (the domain is an open question) and the consent screen published, or test users added. The Google button stays hidden until both keys are set.
- The Railway development database is migrated; its Postgres service has a TCP Proxy on port 5432, and the app's `DATABASE_URL` is Railway's `DATABASE_PUBLIC_URL`.
- `main` is on [github.com/Ramil3107/saymo](https://github.com/Ramil3107/saymo), a public repository, with the engine and the font library. The engine's state: the vocabulary iteration has steps 1 to 7 built (see "Order of work" in [Vocabulary](./vocabulary.md)); step 3 of the variety plan (backdrops and the camera) is merged to `main`, but the owner has not looked at it; step 4 waits for that look. The director and the frame notes are written in the session (`pnpm spike` stops with exit code 3, then `--resume`; see [Pipeline](./pipeline.md)). The Lambda site `saymo` still holds the old bundle: redeploy it ([Lambda runbook](./runbooks/lambda.md)) before Lambda renders pick up the font library.
- Biome, the type check and the tests are green.

## Next

Slice 2 per the Roadmap of `docs/superpowers/plans/2026-11-09-app-foundation.md`: the main path on the mock engine. The Home prompt, generation jobs on pg-boss with a worker, Generating with the plan card and questions, Generation failed, Video and edits, the Editor and My videos. It gets its own plan first. The owner's look at the variety step 3 can happen in parallel; the engine plugs in after the application.

Engine side, variety across videos, starting with compositions and color: the owner chose it on 2026-10-31. The plan is under "Variety across videos" in [Vocabulary](./vocabulary.md). Step 1, the first five composition families, was accepted by the owner on 2026-11-01: the lab in `runs/composition-lab/` (both styles, `sheet.jpg`) and the four text-only ads planned again in `runs/variety-text/` (`before-after.jpg` beside the old contact sheet). On the owner's first look the cropped number read as a defect, so `edge-number` became `giant-number`, whole in the frame. Step 2, accepted by the owner on 2026-11-09, brought palettes for videos without a brand (eight, five per style, named in the plan) and five more families, `bands`, `diagonal`, `inset`, `corner-stack` and `echo`. The lab is in `runs/composition-lab-2/` (both styles, `sheet-new.jpg` holds the ten new beats); the four text-only ads were planned again with the new families, each in its own palette (knit flamingo, ledger forest, dental ocean, bakery tangerine), in `runs/variety-text/`, with `contact-sheet-step2.jpg` beside the step 1 sheet and the step 1 runs kept in `runs/variety-text/step1/`. Step 3 was built on 2026-11-09 and waits for the owner's look: ten backdrops named per video (the owner approved the set: `bold-pop` glow, color, night, halftone, pills, streak; `clean-paper` paper-grid, studio, dots, sketchbook, night) and the camera moving the backdrop behind still text. The lab is in `runs/backdrop-lab/` (one run per backdrop and style, `sheet-bold-pop.jpg` and `sheet-clean-paper.jpg`, a frame per beat); the four text-only ads were planned again, each on its own backdrop with the camera moving (knit night, ledger dots, dental studio, bakery color), in `runs/variety-text/`, with `contact-sheet-step3.jpg` and `before-after-step3.jpg` (step 2 above, step 3 below) and the step 2 runs kept in `runs/variety-text/step2/`. Step 4, no repeats across one user's videos, comes after the owner's yes.

The rule proposed by the learning of 2026-10-31 in [Learnings](./learnings.md) (a contact sheet of a set of videos before they are shown, in the `spike` skill) still waits for the owner's yes.

## Backlog

- Hardening for slice 5: a CSP and the other security headers; the rate limiter behind Railway's proxy: check what Railway forwards (`X-Forwarded-For` overwritten or appended, `X-Real-IP`), set `advanced.ipAddress.ipAddressHeaders` or `trustedProxies` to match (Better Auth 1.7.18 puts requests without a resolved IP into one shared bucket), and test that two clients get separate limits.
- Small polish that slice 1 deferred: sign out has no failure handling; Resend keeps no keyboard focus while disabled; the email is not trimmed before validation; the proxy matcher skips every path with a dot; `requireUser` and the matcher have no tests; a few minor items in the primitives (an icon button link drops extra props, the dialog does not guard Esc while busy); `localhost:3000` is written in three places in the e2e setup.
- Later slices, from the slice 1 review: `server-only` guards on server modules; production-only defaults for `SMTP_URL` and `EMAIL_FROM`, with relaxed TLS only for Railway's proxy hosts; a per-address limit on sign-in emails; tests for `requireUser`, `getUser` and the proxy matcher; `isPublic("//…")` is treated as public.
- Google in production: an OAuth client for the real domain, once the domain is chosen, and the consent screen published or test users added.
- Media in the document: photos and collage named in the plan.
- The sound-effect layer and music tracks; the videos are silent now.
- A list made for the backdrop; a card cropped to the subject instead of the whole frame.
- QA warnings fed back to the director; captions that keep clear of text burned into the source.
- The director model: Opus against Sonnet through the API, paid, so only with the owner's go-ahead.
- The owner's three asks in `docs/product/05-open-questions.md`: one video cut from several sources, placement around any detected object, generated backgrounds.

## Prompt for the new session

```
Read CLAUDE.md, docs/handoff.md and the plan docs/superpowers/plans/2026-11-09-app-foundation.md (the Roadmap).
Slice 1 of the application lives on the branch app in the worktree .claude/worktrees/app. Check git log and the
working tree, tell me in Russian in two or three lines where it stands (merged or not), then
carry on: merge slice 1 if I say so, and write the plan for slice 2, the main path on the mock engine.
```
