# Saymo. Design of the first version

Date: 2026-10-28. Status: agreed in chat, checked by a reviewer, awaiting the owner's approval.

This is the main document. The handoff in `docs/product/` and `docs/design/` remains the source of details (screens, components, tokens, economics), but where it disagrees with this document, this document is correct. The list of discrepancies is in section 2.

## 1. What we build and why

**Saymo** is a service that turns a user's video or text into a finished video for social media: editing, zooms, captions, motion graphics in the brand's style. The person uploads a recording or writes what they need and presses one button. A minute later they see a plan, a few minutes later a finished video, and they edit it with words and by clicking the frame.

Positioning: "Claude Code, but for videos". You say what you need and edit with words, not sliders.

**Modeled on:** videos the author built by hand for clients in the `video-editing` project (synevo, batorshina, ame and others): footage of a person talking, cuts, zooms, chips and plates around the person, big numbers, captions with word highlighting, music ducked under the voice. Saymo does the same without the author in the loop.

**Who it is for:** marketers and social media managers in small companies, freelancers, small agencies. They need 5–20 videos a month. They do not know After Effects, and a motion designer is expensive.

**The main gesture,** which has to be memorable: click any element of the frame, say what to change, see the result right away.

**Three entry modes,** one pipeline:

1. Own video plus graphics. The main mode.
2. Text only, a video made entirely of graphics.
3. Minimal graphics: captions, cuts, zooms.

The mode is not chosen explicitly: the director infers it from what the user provided and where the video is going.

## 2. What changed compared with the handoff of October 21

| In the handoff | Now | Why |
| --- | --- | --- |
| Main scenario: text → motion video. Own video after launch | Main scenario: own video plus graphics. Text mode is second | The owner originally wanted an equivalent of their own manual work with footage |
| Three variants per generation | One variant | Three variants are three times more expensive and take longer; edits replace choosing by eye |
| Format and length are chosen by hand (9:16, 15 s) | "Where to" is chosen (Reels, Stories, etc.), the director proposes the length | One setting instead of three; the result is more relevant |
| Generation without questions | A plan card after 30–90 s, with up to three questions that have defaults | Unclear points get clarified without getting in the way |
| Voiceover, music, captions "next" | Music from a library, ElevenLabs voice, captions in the first version | Voice and captions change the pipeline, adding them later costs more |
| Screen 3.1 Add graphics is secondary | Add graphics becomes the central pattern: the service proposes, the person agrees | Follows from the main scenario |
| Screen 3.2 Podcast clips in the first version or later | After launch, as a "long audio" mode | Sources are up to 10 minutes, podcasts do not fit |
| The "Three more versions" button | Removed | There is one variant |
| Video length 10, 15, 30 s | The result is up to the length of the source, no more than 10 minutes; text mode up to 3 minutes | The author's reels ran over a minute, 30 s is too short |
| Technologies are not chosen | Chosen, section 7 | This document |

The handoff screens remain the basis of the interface. What needs to be redrawn is listed in section 12.

## 3. Goals, non-goals, anti-goals

**Goals of the first version:**

- A person uploads a video or writes a text and a few minutes later gets a video that is not embarrassing to publish.
- Any edit in words or by a click applies within seconds and breaks nothing nearby.
- The process does not depend on the browser tab: the person leaves, comes back and continues from the same place.
- The cost of a video, edits included, is known and fits within the plan.
- The code and the structure are such that they do not need to be rewritten in six months.

**Not in the first version:** music generation and a custom audio file (right after launch, these are two sources for a ready-made slot), 40-minute podcasts, a critic model, an editor on the phone, teams and roles, several brands, custom fonts, comments on the link, auto-posting, a mobile app, an API, other interface languages, generation of footage with neural networks.

**Anti-goals,** what would make the product a failure even if everything works:

- The interface has turned into an editor with panels and settings.
- An edit waits half a minute for the model and costs tens of cents.
- Videos are recognizably alike, "from a template".
- The internet went down and the generation was lost.
- A client opened the review link on a phone and it does not work.
- Code with long comments from the AI, abstractions for the sake of abstractions, and duplication.

## 4. User flow

Screen numbers follow `docs/design/screens.md`.

### 4.1 Sign-in

Landing (1.1) → Sign in (1.2): Google or a link by email → Check your email (1.3) → Home (2.1). Sign-in comes before Home, as in the mockups. The first sign-in creates an account. Brand (1.4) is not required and is offered after the first video.

### 4.2 Home

The main field accepts three things: drag or choose a video, write text, paste a link. Uploading a video is the main path and has to be as noticeable as the text field. Next to it is a "where to" chip:

| Where to | Format | Length ceiling | What else it sets |
| --- | --- | --- | --- |
| Reels / TikTok | 9:16 | 3 min | Safe zones for the interface, captions on |
| Stories | 9:16 | 60 s | Same |
| Shorts | 9:16 | 3 min | Same |
| LinkedIn / X | 16:9 or 1:1 | 10 min | Captions on, zones less strict |
| YouTube | 16:9 | 10 min | Captions as decided by the director |
| Just a file | any | 10 min | No platform restrictions |

The default is Reels / TikTok, and the last choice is remembered. The ceiling is a guideline for the director, and the hard limit is set by the plan (section 4.8).

The examples to start from stay, but they change for the new scenario: interview → reel, screen recording → how it works, customer testimonial → customer story, launch from text, sale from text, the quarter's numbers from text. An example fills in a starter text or shows which video to upload.

Under the button there is a line: "Usually a minute or two. If anything's unclear, we'll ask you here." In text mode: "About a minute".

One video is made from one source. A link in the field is a web page from which text and images are taken, not a video to download.

### 4.3 Generating

Screen 2.2, reworked for a single variant. Steps: Watching the video → Writing the plan → Building → Ready. In text mode the first step is skipped.

**The plan card** always appears, and always before the build: one to two minutes after the button in video mode, 30–60 seconds in text mode. It is always the same point in the flow, and people get used to it. The card holds:

- the title of the video and one line on what it is about;
- who is in the frame (names from the transcript, otherwise placeholders);
- where to and how long, for example "Reels · 0:45 of 5:12";
- beats as a list, one line per beat with a timecode;
- character and music: the register in words, the mood of the track;
- the director's assumptions, if any;
- questions, no more than three.

**A question** is only something that changes the result and that the director cannot guess: whose name to show, which product is the main one, which of several strong clips to cut, whether there is a brand. Each question has two to four answer chips, the default is already selected, and there is "Skip". One Continue button accepts the defaults. There are no timers and no auto-continue.

**No questions:** the card is labeled "Building now" and the build is already running.

Screen 3.1 Add graphics is not built separately: its role, "the service proposes, the person agrees", is played by the plan's beats and the What next suggestions.

**Plan edit:** beat lines are edited in place, plus a "Change something" field with free text. Any change to the plan sends it back to the director for revision and restarts the build. Before the first finished build this is free and does not count as an edit.

**If the person left:** the job lives on the server. In My videos the video card shows the current step or "Needs 2 answers". An email if the video waits for answers longer than 10 minutes, and a "video is ready" email if the person left before it was ready.

**If it did not work out:** screen 2.3, the attempt is not charged, the person can retry or change the description.

### 4.4 Video and edits

Screen 2.4. One video instead of the Versions column. The column's place is taken by nothing or by a list of scenes (the builder decides, going by the mockup without Versions).

- A click on an element in the frame selects it, and the edit panel shows the element's name and the quick edits that fit its type: for text Bigger, Rewrite, Change font, Remove; for footage Zoom in, Trim, Replace; for captions Style, Position. Replace for a footage clip means another clip from the same source.
- With nothing selected, the field edits the whole video: "faster", "more serious", "remove the music".
- Undo is always there, for every edit.
- The format switch re-lays out the frame. This is free and local.
- What next is picked to fit the video: Shorter (0:30), Longer (1:30), Make a 16:9 for LinkedIn, Add captions (if they are off), Change music.
- The Editor link leads to the manual editor (2.5): the order, length and text of scenes, trimming of footage clips, choosing the clip for a zoom. There are no layers or keyframes.

What counts as an edit for the limit: a call to the model. Quick edits, format, Undo and the editor do not count. The cap is 30 edits per video, and a length change counts as one edit.

### 4.5 Download and Send for review

Download (4.1): formats 9:16, 1:1, 16:9 as chips, quality 1080p on Pro and 720p on Free, a watermark on Free. Each format is its own layout and its own render on Lambda, usually 5–20 seconds. File rows with progress, Save downloads the MP4. A "file is ready" email only if the render takes longer than two minutes and the person left.

Send for review (4.2) and Review link (4.3): a public page at an unguessable link, no sign-in, plays the MP4, "Made with Saymo" and a Make your own button. The link can be turned off. If there is no finished render, turning the link on starts it.

### 4.6 Library and account

My videos (5.1, 5.2): video cards with a poster, title, format, length, date and state (ready, building, waiting for answers, error). A filter by format. Rename, duplicate, delete with confirmation. Account (5.3): profile, plan and counter, brand, account deletion with confirmation.

### 4.7 Brand

Screen 1.4 is unchanged: a website address and Fetch brand (logo, colors and font are shown to be checked, nothing is saved without confirmation), or manual entry. One brand per account. Without a brand the video is made in a neutral style, and after the first video the service offers to set one up.

### 4.8 Plans and limits

| | Free | Pro |
| --- | --- | --- |
| Price | $0 | $29 a month, a placeholder until the cost is measured |
| Videos per month | 2 | 20 |
| Source | up to 5 minutes and 1 GB | up to 10 minutes and 2 GB |
| Result | up to the length of the source; text mode up to 3 minutes | same |
| Edits per video | 30 | 30 |
| Watermark | yes | no |
| Quality | 720p | 1080p |
| Storage | 30 days, sources too | as long as there is a subscription |

A video is one press of the button: it is charged immediately on the press and refunded if generation fails. Free refreshes on the first of the month, Pro on the renewal day. Limit reached: window 6.1, the text is not lost. Plans (6.2), payment with the merchant of record, Welcome to Pro (6.3). Cancellation in one click, access until the end of the paid month. Failed payment: an email, three days, then Free.

### 4.9 Phone

Desktop for work, phone for viewing. These must work on a phone: Landing, Sign in, Review link, My videos, Account, Plans. Home works too (uploading from a phone is a real scenario). Video and edits on a phone shows the frame and the edit field stacked in a column, without the editor. Editor is desktop only. Layouts are fluid from day one, with no "desktop only" assumptions in the design system.

## 5. The video as data

A video is a JSON document following our schema. This is the main architectural decision: the model does not write code, it returns data, and the engine executes it.

**What is in the document:** destination and format, frame rate and duration, brand, a list of assets (source video, proxy, audio, images, logo), tracks: footage (clips with trims), scenes with elements, camera, captions, music, voice. Every element has a stable id, a type from the vocabulary, parameters and timing.

**Schema rules:**

- The Zod schema is the single source of truth: the TypeScript types and the JSON schema for the model are derived from it.
- Any model output is validated, and invalid output is not applied.
- The only way to change the document is a list of operations: set, remove, insert, move, trim, retime, restyle. Operations are applied purely, with no side effects.
- Every edit is a new version of the document: a full snapshot plus the list of operations that produced it. Undo is a move to the previous version.
- Beat and element ids are stable across rebuilds: the plan issues them, not the build. When the director revises the plan, it preserves the ids of the beats it keeps.
- Style decisions (music, caption style, register, fonts, colors) sit in a separate section of the document and survive any rebuild.
- Any element can be selected with a click: the engine puts the element id into the DOM.
- The layout for 9:16, 1:1 and 16:9 is computed from the document deterministically. The format does not store three copies.

**Register** (from the motion spec of October 7): three axes (energy, tone, density) and the presets driving-launch, serious-clinical, rich-premium, playful-sale. The register sets timings, curves, staggers, font weights and the number of elements in a scene. The vocabulary reads the register and QA checks it.

The exact set of fields is left to the builder; the constraints above are mandatory.

## 6. Vocabulary of primitives

The vocabulary consists of React components on Remotion with parameters from the document. A scene is a composition of primitives, not a template with fields. The model picks words from the vocabulary, and the engine assembles them.

**Minimum for the first version:**

- Footage: a trimmed video clip, background footage, an image, a logo, a shape, Lottie.
- Camera: push, punch-in, pan, parallax over an image or a screenshot.
- Text: headline, subheading, a big number with a counter, quote, name plate (lower third), chip, step list, sticker.
- Captions: karaoke, box and pop styles; position; highlighting of the current word.
- Entrances and exits: fade, slide, mask, by word, by letter, typewriter.
- Accents: marker, underline, ring, pulse, shake, flash.
- Transitions: cut, fade, slide, wipe, push.
- Backgrounds: color, gradient, brand, blurred footage.
- Audio: music ducked under the voice, voice, loudness normalization.
- Layout: slots around the person with keep-out zones, grids, safe zones per destination.

**Where to get them:** GSAP with all plugins (free since 2025, its timeline can be seeked to a frame inside Remotion), Remotion packages (transitions, captions, shapes, paths, lottie, layout-utils, google-fonts), Remocn (MIT), techniques from the author's `video-editing` project. Third-party code is ported into the vocabulary under our schema, not plugged in as is.

**External assets of the vocabulary** come in the first version only with permissive licenses and with a license manifest in the repository: Lucide icons, open illustrations, Lottie under the Lottie Simple License. Stock footage for text mode is not in the first version: backgrounds are built from the brand, gradients, shapes and images from the link. If stock footage is needed, it is a separate licensed source, a question for the owner.

**Catalog:** an internal page where every primitive plays in every register and format. It is a way to navigate the vocabulary, the base for visual tests and, later, a public showcase. A new primitive without a card in the catalog is not considered done.

**The watermark** for Free is also a primitive, and its design is up to the owner.

## 7. Pipeline

Every video is a job on the server with states: queued → ingesting → analyzing (transcription and frame understanding in parallel) → planning → awaiting_answers → building → checking → ready, or failed at any step. Every step is idempotent, writes artifacts to S3 and the database, and restarts from the point of failure. The interface subscribes to the job state and shows the current step. After a page reload nothing is lost.

Steps for a 5-minute source and timing guidelines:

1. **Upload.** Straight to S3 in parts, with resume. The plan's limits are checked before and after. ffprobe checks that the file is a video and that its length is within the limit.
2. **Ingest.** The fast part first, seconds: audio track, shot boundaries, keyframes. Then in the background, 1–2 minutes and off the critical path of the plan: a normalized source and a 720p proxy for the preview in the browser.
3. **Transcription.** Words with timecodes, speakers, language. 20–60 seconds, in parallel with step 4. The provider is chosen in the spike: ElevenLabs Scribe (the same vendor as the voiceover) versus Deepgram.
4. **Frame understanding.** Faces and people per frame, with bounding boxes and timecodes (an ONNX model in Node versus AWS Rekognition, chosen in the spike). Shot keyframes through Claude: what is in the frame, where the person is, a screen or a face, text on the screen. 20–40 seconds, in parallel with step 3. Result: the content map.
5. **Director.** Waits for steps 3 and 4. Claude with structured output: the transcript and the content map go in, the plan comes out: title, what it is about, who, where to and the length, beats with footage intervals, zooms, graphics and caption style, music, register, assumptions, questions with defaults. 30–60 seconds. Text mode: the input is the text and the content of the link, and the director writes the script and the scenes itself.
6. **Questions.** If the plan contains questions, the job waits in awaiting_answers. Answers are merged into the plan, and the director is not called again if the answers match the defaults.
7. **Build.** Deterministic: plan → video document. Voice through ElevenLabs if the director decided it is needed (in text mode the default is music only, except for narrative genres). Scene durations adjust to the speech, captions come from word timings. Seconds plus voiceover time.
8. **QA.** Code checks. The text fits, otherwise shrink it, wrap it, and as a last resort ask the model to shorten it. The scenes add up to the length and the minimum holds are respected. There are no more words on the screen than the register's limit, and the reading speed is within the norm. Text contrast on the actual background. Safe zones per destination. Elements do not cross the keep-out zones of faces. The voice is not longer than the scene. The schema is valid, and the assets and fonts are in place. Milliseconds.
9. **Ready.** A poster as a single frame on Lambda. The browser preview plays the document through Remotion Player over the proxy, no render needed.
10. **On-demand render.** Lambda, on download and for the review link. One format is one layout and one render.

In total for a 5-minute source: the plan comes one to two minutes after the upload, and the video is ready in 2–4 minutes. Text mode: the plan in 30–60 seconds, the video in one to two minutes.

**The critic model** (scoring frames against a rubric) is not switched on in the first version. After launch we collect 30 test requests and a gallery, evaluate them by eye, and switch the critic on selectively for recurring taste problems that the vocabulary does not fix.

**Cost tracking:** every call to the model, to the voiceover and to transcription, and every render, is recorded as an event with tokens, seconds and price, attached to the video. The cost of a video with its edits is visible in the admin panel from day one.

## 8. Edits

- A click on an element → id → the edit panel knows the type and offers quick edits.
- A quick edit and a format change: local operations, no model, instant.
- An edit in words: Claude receives the document, the selected element and the request, and returns a list of operations. Validation, application, a new version, QA, and the preview updates without a render. Target: up to 5 seconds, a cheap model wherever it is enough.
- An edit of the whole video with nothing selected: the same, without an element.
- A length change: the director re-cuts the plan and the build runs again. It counts as one edit toward the limit.
- The manual editor: the same operations, applied by hand.
- Undo: the previous version.
- **Edits survive a rebuild.** When the plan changes (Shorter, Longer, a plan edit), the build runs again, and after it the operations of all past edits are applied again to the elements whose ids were preserved. Operations without a target are dropped, and the plan card reports "2 edits didn't survive the re-cut". Style decisions always survive a rebuild, because they sit in the document and not in the operations.

## 9. Application architecture

**One app, two entry points.** Next.js for the interface and the API, and the worker as a second entry point into the same code, for the pipeline. The shared video code (schema, vocabulary, operations, QA) lives in one folder and is used by the browser preview, by the build in the worker and by the render on Lambda. There is no monorepo until one is needed.

**Structure:**

```
src/
  app/            Next.js routes, thin: they assemble screens from slices
  features/       vertical slices, each with its own components, server actions, queries and tests
    auth/  brand/  library/  generation/  editing/  rendering/  review/  billing/  account/  admin/  landing/  emails/
  video/          schema, operations, vocabulary, layout, QA, registers, catalog
  ui/             design system: tokens, primitives, icons
  worker/         worker entry, pipeline steps, queue
  lib/            thin infrastructure: db, env, storage, ai, jobs, i18n
messages/         interface strings, English only for now
docs/
```

Rules: a slice does not import the internals of another slice, only its public entry. A screen is assembled from slices in `app/`. Everything about the video lives in `video/` and knows nothing about the database or users.

**Data.** Postgres, Drizzle. Main tables: users and sessions (Better Auth), brands, videos, video_versions (document snapshots), jobs and job_steps, assets (uploads, proxies, posters, renders), usage_events, subscriptions, review_links. Migrations are in the repository.

**Queue.** pg-boss on top of the same Postgres: no Redis, no second database. The worker takes jobs, and the steps write progress to job_steps. The interface gets the job state over SSE with a polling fallback.

**Storage.** S3: sources, derived files, renders. CloudFront in front of it. Private, served by signed links, and the review page gets a short-lived signed link each time it is opened.

**Render.** Remotion Lambda in our AWS: the function and the vocabulary bundle are deployed from CI on every change to the vocabulary. Local rendering with the same code, for development and as a fallback.

**Sign-in.** Better Auth: Google and an email link, no passwords. Free videos are tied to a verified email.

**Payment.** Merchant of record: Paddle or Lemon Squeezy, the choice depends on which one accepts the owner's registration. Subscriptions and events arrive by webhooks into subscriptions. Limits are checked on the server on every charge.

**Emails.** Resend and React Email: the sign-in link, the video waits for answers, the video is ready, the file is ready (if it takes long), welcome to Pro. Receipts and reminders about a failed payment are sent by the merchant of record.

**Analytics and errors.** PostHog: the funnel from sign-up to payment, the second video, edits before download. Sentry in the web app and the worker.

**Admin panel.** A route under the admin role: users, videos, jobs with steps and cost, granting videos manually, blocking an account.

**Localization.** next-intl from day one, all interface strings in `messages/en.json`, only keys in the code. A second language is added with a file. The language of the video is a separate axis: the director writes in the language of the request, and the list of brand fonts includes Cyrillic.

**Design system.** The tokens from `docs/design/tokens.css` become the Tailwind v4 theme. Components in `src/ui/` use only tokens. Outside `src/ui/` there are no raw colors, sizes or shadows. Accessible primitives (dialogs, selects, switches) are on Radix. A design change is a theme file and the `ui/` folder.

**Security.** Uploads are checked with ffprobe and limits before processing, and are processed only in the worker, through ffmpeg with timeouts. Logo SVGs are sanitized. Model output is validated against the schema. Code from the model is never executed anywhere. Review links are unguessable. Rate limiting on generation and on sign-in emails. Content rules in the legal documents and blocking in the admin panel. Database backups daily.

**Performance.** Server components by default, client components only where there is interactivity. Remotion Player loads lazily, and the preview runs over the 720p proxy. Fonts are self-hosted. Indexes on all queries by user. No N+1. A budget on the size of client bundles is checked in CI.

## 10. Technologies

TypeScript everywhere. Node 22, pnpm. Next.js, the current stable version, React 19, Tailwind v4, Radix. Remotion 4.x (the license is free for companies of up to three people, the terms change in 5.0, recheck on upgrade). Postgres, Drizzle, pg-boss. S3, CloudFront, Remotion Lambda. Better Auth. Paddle or Lemon Squeezy. Resend, React Email. PostHog, Sentry. next-intl. Anthropic SDK with tool use for structured output, prompt caching for the system instructions with the vocabulary. ElevenLabs for voice. ffmpeg. Biome for linting and formatting. Vitest for unit tests, Playwright for the main path. GitHub and GitHub Actions. Railway for web, worker and Postgres, AWS only for Lambda, S3 and CloudFront.

Claude models: the director and vision on a Sonnet-class model, cheap edits on a Haiku-class one. The final choice follows the measurements in the spike.

## 11. Code rules

The full text goes into the repository's `CLAUDE.md` when the scaffold is set up. The gist:

- Code reads without comments: names say what is going on. A comment only where the "why" is not obvious, in one line.
- No long AI explanations, divider headings, "TODO: think about it" or dead code.
- Simple structure: vertical slices, small functions, no layers for the sake of layers. An abstraction appears on the third repetition, not earlier.
- Zod at every boundary: user input, model output, webhooks, env.
- Performance is considered while writing, not afterwards: server components, heavy things loaded lazily, indexes, no extra queries.
- Strict TypeScript, no any. Biome clean, tests green before every commit.
- Tests where there is logic: schema, operations, layout, QA, limits, webhooks. One e2e test for the main path.
- Interface strings only through localization keys. Styles only through tokens.
- Commits are small and meaningful. Decisions go in `docs/product/decisions.md`.

## 12. What to redraw

The owner's task, on the design canvas:

- Home: video upload as the main path, the "where to" chip, examples for the new scenario.
- Generating: one variant, steps, a plan card with beats and questions, the "Building now" state.
- Video and edits: without the Versions column, the line "0:45 · Reels · of 5:12", quick edits for footage and captions, Undo, the "edit is being applied" state.
- Editor: a footage track with trimming.
- My videos: card states (building, waiting for answers, error).
- The watermark, a 404 for a turned-off link, deletion confirmations, "copied" notifications.

Until the redraw, the builder implements the screens following the rules in `docs/design/` and the descriptions above.

## 13. Order of work

| Stage | What | Done when |
| --- | --- | --- |
| 0. Scaffold and spike | The repository, `CLAUDE.md` with the rules, the skills from section 16, the documentation site, the user flow diagram. Spike: a command in the terminal: video or text → plan → document → MP4 locally, once through Lambda. Measuring time and price per step. Choosing the transcription and detection providers | The documentation site opens, and the user flow diagram is on it. Three different pieces of footage and two texts give videos that can be shown to a person. A table of measurements in the documentation. Decisions in the log |
| 1. Engine | Schema, operations, versions, registers, the vocabulary of the first version, layout for three formats, QA, Player with selection by click, catalog | The catalog shows all primitives in all registers and formats. A hand-written document looks the same in Player and in the Lambda render |
| 2. Pipeline | Upload, ingest, transcription, frame understanding, director, questions, build, jobs and SSE, plan card | Upload → ready without interface polish, survives a page reload, questions work |
| 3. Main path | Home, Generating, Video and edits with edits and Undo, What next, formats, Editor | The main path matches the mockups, from the button to a finished video |
| 4. Account | Sign-in, brand with Fetch brand, My videos, Account | A new person goes from the landing page to the first video without help |
| 5. Output | Download on Lambda with formats and the watermark, the review link | The file downloads, the link opens from a phone |
| 6. Business | Payment, limits, emails, legal documents, a landing page with real videos, analytics, Sentry, the admin panel, rate limiting, backups | The launch checklist from `docs/product/02-mvp-scope.md` is closed |

A time guide for one person with Claude Code: spike a week, engine three, pipeline three, main path two, account one and a half, output one, business two. About fourteen weeks, with a lot of uncertainty around the engine and the pipeline.

## 14. What is left to the builder

- The exact schema fields, the format of the operation list and the rules for reapplying operations after a rebuild.
- The choice of the transcription and detection providers based on the spike results.
- The choice between Paddle and Lemon Squeezy after the registration is checked.
- QA thresholds, the list of caption styles, the set of registers beyond the four.
- How exactly to show the list of scenes on the video screen instead of the Versions column.
- SSE versus polling, if SSE turns out to be inconvenient on Railway.
- The structure of the prompts for the director and for edits, including porting the rules and the anti-slop from the motion spec.

## 15. Open questions for the owner

| Question | What it depends on |
| --- | --- |
| The source and license of the music library at launch | The "music" step in the build, rights |
| What the watermark looks like | A primitive in the vocabulary |
| Redrawing the screens from section 12 | Stages 2–3 |
| The Pro price after the spike | Landing page, Plans |
| The country of registration and the choice of merchant of record | Stage 6 |
| Domain | Emails, review links |
| Whether stock footage is needed in text mode and where to get it under a license | Without it, the backgrounds in text mode are made from the brand, gradients, shapes and images from the link |

## 16. Development tools and documentation

**Claude skills in the repository** (`.claude/skills/`), set up in stage 0 and growing along the way:

- `learn`: record a lesson on the learnings page after a task or the owner's feedback, and propose a change to a rule in `CLAUDE.md` or in a skill. The flywheel: every failure becomes a rule, a primitive or a check, never a template.
- `decision`: add an entry to the decision log following the template: date, what was decided, why, what was rejected.
- `docs`: update the documentation pages for the affected area and the user flow diagram. A task is not closed until the documentation is updated.
- `review`: a self-check of the diff against the code rules before a commit: readability, slices, Zod at the boundaries, performance, tests, strings through localization, styles through tokens.
- `vocab`: add a primitive to the vocabulary: the component, the parameter schema, a card in the catalog, a test for registers and formats.
- `spike`: run the spike on a file or text and record the measurements in the table.

**Documentation** lives in `docs/` as small pages by topic, not one big file, and is built into a VitePress site with Mermaid diagrams. Sections: overview, user flow, architecture, pipeline, video schema, vocabulary with a link to the live catalog, decisions, learnings, runbooks (environment, deploy, incidents). After approval this document is broken down into pages, and it stays as a historical record.

**The user flow** for everyone, not only for technical people: `docs/user-flow.md`, Mermaid diagrams: an overall map and one per flow. Nodes are screens, arrows are actions, and emails and notifications are separate nodes with conditions. Any change to a flow changes the diagram in the same commit. On request the diagram is exported to FigJam for presentations.

