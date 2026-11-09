# Decision log

Each decision: date, what was decided, why, what was rejected. New entries on top. If a decision changes, the old entry is never deleted. A new entry is written with a link to the old one.

---

### 2026-11-09 · The engine pauses, and the application is built around a mock engine

- **Decided:** work on the vocabulary pauses, and the application around the engine comes next: every screen of the design system, sign-in with Google and an email link, the database with its migrations, the library, the brand, the account, plans and limits, built to launch standard, secure and working for real. Generation runs behind the boundary the real pipeline will use, with a mock engine that returns a sample plan and a sample video document after realistic waits; the current engine is plugged in next and switched on by one setting. Payment is mocked behind the boundary a merchant of record will use: a checkout page of our own where any card goes through and grants the chosen plan with its limits, so a real provider replaces the mock without touching the screens or the limits. The owner's call on 2026-11-09. This changes the order in the entry "The vocabulary comes before the infrastructure" (2026-10-30): the application now comes before the rest of the variety plan.
- **Why:** the product does not feel real without the application around the engine, and the owner accepts rough videos from the current engine as long as everything else works and is secure. A mock engine keeps every click free while the application is built (through the paid services a two-minute talking head costs about $0.55 and a text-only video about $0.06), and one boundary for the mock and the engine makes the swap a setting, not a rewrite.
- **Rejected:** the current engine wired in from the first screen (every click paid, and S3 and rendering needed before the first screen works); a first slice of a few screens with the rest later (the owner wants every screen).

### 2026-11-09 · A video names its backdrop, and the camera moves the backdrop behind still text

- **Decided:** ten backdrops live in `src/video/backdrops.ts`: `glow` and `paper-grid`, the old looks of `bold-pop` and `clean-paper`, and eight new ones, `color`, `night`, `halftone`, `pills`, `streak`, `studio`, `dots` and `sketchbook`, each drawn in the video's colors after a reference the owner recorded. Each style lists the backdrops that suit it, its first being its old look (`bold-pop` glow, color, night, halftone, pills, streak; `clean-paper` paper-grid, studio, dots, sketchbook, night). The plan carries an optional `backdrop`, like `palette` but with a brand too; the build writes the resolved one into the document, and one the style does not list gives way to the style's first. `color` and `night` are grounds: text on them reads as on an accent or an ink field, a field that would take the ground's tone takes another, and a dip passes through the ground. On a beat without footage the beat's camera (`push`, `pan`, `punch-in`) moves the backdrop and nothing else; the backdrop runs on the video's time, so it flows on across cuts. A marker now reads under both the ink and the accent text of its field. The owner approved the set and the camera on 2026-11-09, step 3 of the variety plan.
- **Why:** two backgrounds in all and a camera that never moved on the backdrop were two of the causes of sameness on the contact sheet. A backdrop per video, named by the director like the palette, changes most of the frame from one video to the next, and grounds reuse the field color rules that already keep text readable. Moving only the backdrop gives the frame depth and keeps it alive between snaps, while the text stays crisp, in whole pixels and where the layout put it.
- **Rejected:** a backdrop per beat (a video would lose its look, and every cut would change everything at once); the camera moving the whole frame with its text (text and the accents measured around it on the page would swim, and the layout would have to keep text clear of a zoom); a backdrop drawn past the frame's edges for pans (every look would need a bleed, and the ruled frame of `sketchbook` would sit off the view on still beats), so a pan grows the backdrop just enough to hide its edge instead.

### 2026-11-01 · A video without a brand names its palette in the plan

- **Decided:** eight named palettes live in `src/video/palettes.ts` (cobalt, tangerine, flamingo, ultraviolet, forest, ocean, terracotta, plum), each an accent, a light highlight and a dark second tone with a one-line mood for the director. Each style lists the palettes that suit it, five each (`bold-pop` the loud ones, `clean-paper` the calm ones, cobalt and forest in both), the way it lists its captions and transitions. The plan carries an optional `palette`, like `style`: the director names one when the brief says "Brand: none", and leaves it out when there is a brand. The build turns the palette into the document's brand colors, so the renderer and the brand palette logic stay as they are; a brand always wins over the palette, and a plan without one gets cobalt, the old default blue, so older plans render unchanged. The run no longer hands the director the default brand, so its brief says "Brand: none". This is the lead's call, the second step of the variety plan; it gives the spec's "neutral style" for a video without a brand a color of its own.
- **Why:** with no brand every video got the same blue, the main color cause of the sameness on the contact sheet. The director knows what the video sells and its mood, so it picks the colors the way it picks the style; the choice in the plan is data, can be shown, kept in a user's history for step 4 and changed by an edit. Folding the palette into the brand colors reuses the accent, highlight and second tone rules that already keep text readable.
- **Rejected:** the build picking a palette from the plan's title or a hash (no sense of the content, and the same text would always get the same colors); palettes as a full set of tones that also change the background (that is step 3, backgrounds); one shared list of palettes without a per-style list (the director would put soft clinic colors on a loud sale).

### 2026-11-01 · Fonts come from a library in the repository

- **Decided:** a font library of 40 families under the SIL Open Font License 1.1 lives in `public/fonts`: display faces (Unbounded, Dela Gothic One, Russo One, Rubik Mono One, Tektur and more), neutral sans, serifs, condensed, rounded, mono and hand-written faces. Each family is Latin and Cyrillic woff2 from Fontsource, one variable file per subset and style where the family is variable (all weights in one file), with its license and an entry in `public/fonts/manifest.json`; five faces are Latin-only (Syne, Space Grotesk, Instrument Serif, Anton, Bebas Neue) and name a Cyrillic fallback face. A render loads only the faces its document uses (the style's display face, the brand font, the caption serif when the captions are set in it) from the library and waits for exactly those; a brand font the library does not have falls back to Onest. `@remotion/google-fonts` is removed, and `pnpm fonts:add` adds a family. The owner asked for many fonts in the repository and chose the 40-family option on 2026-11-01, about 2.9 MB.
- **Why:** every render tab fetched 36 font files from Google, and three local renders timed out on those fetches on 2026-10-31; the coming styles and the brand font list need many more faces than four, and a local library renders the same offline, in Studio and on Lambda. Variable files keep 40 families under 3 MB.
- **Rejected:** 12 families, about 1.1 MB (too few faces for the styles to come); 25 families with Cyrillic only, about 2 MB, the lead's recommendation (the owner wanted the wider choice); keeping `@remotion/google-fonts` and loading only the faces a document uses (still a network fetch on every render); static files per weight (several times the size for the same faces).

### 2026-10-31 · The giant number stays whole in the frame

- **Decided:** the `edge-number` composition, where the frame's left edge cropped the first figure of a counter, becomes `giant-number`: the counter as wide as the text area allows and whole in the frame, the label under it; its other form still sits on an accent field. The element `fill` loses `bleed`. This changes the composition list of the entry "A backdrop beat names its composition, and the build lays it out as data" below. The owner pointed at the cropped figure on 2026-10-31.
- **Why:** on the owner's first look the cropped "4" of "40%" read as a defect, not a technique, and the stress mark drawn under it ran off the frame too. In a 9:16 frame the width already limits the size, so the crop added little size for the risk.
- **Rejected:** a smaller crop (still reads as a mistake); cropping by the bottom or the top edge (under the app's interface in Reels).

### 2026-10-31 · A backdrop beat names its composition, and the build lays it out as data

- **Decided:** a beat without footage carries an optional `composition` (`center`, `fill`, `split`, `edge-number`, `column`, `grid`). The director picks it; the build turns it into element boxes and color fields, and the document carries the fields (`fields` on a scene) and, per element, the field under it (`on`) and how its text fills the box (`fill`). The renderer draws what the document says and knows nothing about compositions. Two beats in a row without footage never share one: the plan check rejects it, so the API director gets its one retry. A repeat takes the family's other form, counted per video. Every render also waits for its fonts before it draws. This is the lead's call, the first step of the variety plan.
- **Why:** the director knows what a beat says (one number, a list of perks, a slogan) and so which frame fits it; placement and color stay deterministic, testable and the same in every format. Fields as data keep the document the single description of the frame. The font wait fixes a measurement cached in the fallback face, which made `bold-pop` titles up to a fifth wider than their box.
- **Rejected:** the build picking a composition from the overlays (the same beat would always get the same frame, which is the sameness being fixed); compositions drawn by the renderer from the composition's name (a second copy of the layout in the renderer); a QA warning instead of a plan check for repeats (the director would never see it).

### 2026-10-31 · Variety across videos starts with compositions and color

- **Decided:** the next work on the vocabulary is variety across videos, and it starts with compositions and color: about ten composition families (type filling the frame, half-frame color blocks, a giant number cropped by the edge, a grid of tiles, a column at the edge, bands), palettes for videos without a brand, six to eight new backgrounds, a camera that moves over the backdrop, and a guard so neighbouring scenes and one user's videos do not repeat a composition. It is checked on a contact sheet of twelve videos that must not read as one template; new blocks (a price tag, a checklist, a rating, before and after, steps) follow. More complete styles come after it, and the owner's references are built alongside as they arrive. The owner's choice on 2026-10-31, from the three options under "Variety across videos" in `docs/vocabulary.md`.
- **Why:** the owner found the final runs alike and the template visible after about eleven videos. A contact sheet of the text-only ads traced it to one blue accent, small centered type with two thirds of the frame empty, two backgrounds, titles and chips as most overlays, and plain cuts over a still backdrop; compositions and color answer those causes directly and carry over to every style built later.
- **Rejected:** styles first (videos differ from each other, but inside each one the centered type stays, and every new element has to be drawn in every style); one reference at a time as the main path (closest to the owner's taste, but slow, and the sameness stays for a long time).

### 2026-10-31 · Layout follows the subject the frame notes mark; frame notes are written locally by default

- **Decided:** a frame note may mark the frame's subject with a box when it is not a person talking (a product, a phone, a screen). Footage is framed on faces, or on the subject when there is none; a subject up to 30% of the frame is kept clear like a face; a subject much wider than a 9:16 crop is shown whole as a card. Kinetic text over footage sits on a soft shade, may use the caption band (captions step aside for it) and is set larger on the backdrop. Frame descriptions have a local mode, the default in `pnpm spike`, like the director's. Keyframes are taken at exact times, every two seconds and inside every shot. This is the lead's call after the final runs; the owner asked on 2026-10-31 whether elements can be placed around anything in the frame.
- **Why:** in the final runs a rotating donut was cropped into a sprinkle texture, a phone was cut in half, white titles disappeared on white footage, chips sat on a face in a close-up the two-second sampling missed (the keyframes were also labelled a second early), and the vision API was the remaining paid call in local checks.
- **Rejected:** object detection with several labelled boxes per frame (more cost and layout rules than the first version needs; noted as an open question); a fixed dark band behind every title (heavier than a shade and hides the footage); keeping faces as the only thing layout knows about.

### 2026-10-31 · The spike's director runs locally by default

- **Decided:** `pnpm spike` has a local director mode, and it is the default. The run writes the system prompt, the user message and the plan's JSON schema to `runs/<id>/director/`, marks the step `waiting` and stops; the plan is written in a Claude Code session on the owner's subscription, checked against the schema on resume, and the run continues to build, QA and render. `--director api` calls the API as the service will. The owner agreed to the order of work on 2026-10-30 and asked why the director needed the API at all.
- **Why:** vocabulary and plan iterations should not spend API money; the brief is exactly what the API would receive, so a plan written from it tests the same contract, and the schema check is the same one the API path uses.
- **Rejected:** the API as the default with a cheap model for checks (still paid, and a weaker director than the one in the session); a separate script that skips the pipeline (`render:plan` already exists for hand-written plans, and the run would miss the voice, music, QA and poster steps).

### 2026-10-31 · An accent is an intent, and the style draws it

- **Decided:** an overlay, and its element, carries an optional `accent` from four intents: `celebrate`, `frame`, `focus` and `stress`. The director picks the intent; the style decides the mark (`bold-pop`: burst, growing frame, brackets, flash blocks; `clean-paper`: sparkles, selection box, circle, underline). The mark is drawn around the text the element shows, measured on the page each frame. It replaces `emphasis` (`marker`, `underline`, `pulse`), which nothing drew. This is the lead's call.
- **Why:** the style owns the look, so a plan moved to another style keeps its accents and they always fit the look; the director thinks in what to point at, not in shapes. Measuring the text on the page puts the mark on the words, not on the slot the layout reserved, which is often much wider.
- **Rejected:** the director naming the shape (a burst in a calm style, and restyling a plan would need a mapping); marks drawn around the element's box (a circle around a wide empty slot); computing text extents per element kind (a second copy of each kind's layout to keep in step).

### 2026-10-30 · The style owns the look and the tempo, the register keeps the pacing

- **Decided:** a video has a style (`bold-pop` or `clean-paper` for now) that sets the display face, the tones, the textures, the tempo and the caption presets, transitions, title entrances and accents it draws from; the brand gives its colors. The register keeps the pacing (scene length, holds, density, music tempo) and picks a default style when the plan names none, so existing plans render as before. The director picks the style and each beat's transition; while a kinetic title is on screen the captions step aside. This is the lead's call.
- **Why:** the register and the style both carried a tempo after step 6, and two owners for one value would drift. A title and a caption block stacked under it put two lines of the same message on screen at once, and the references let the title speak alone.
- **Rejected:** tempo on the register with the style only as a skin (a bold look moving at a clinical pace would not read as that look); keeping captions under titles and shrinking the titles (the title loses its job as the loudest line).

### 2026-10-30 · Higgsfield's motion and motionvid's use cases are the reference

- **Decided:** the vocabulary is measured against Higgsfield's motion graphics for energy and dynamics (bold kinetic type, fast collage, shapes and counters, hard cuts) and against motionvid's examples for the practical use cases: ads for a business or a product, launches and feature announcements, explainers, YouTube and talking-head reels; not AI avatars or generated footage. This replaces the Synevo reel as the reference in the entry "The vocabulary comes before the infrastructure". The work starts from motion, how elements appear, leave and transform (the lead's call), and the components are built on it.
- **Why:** the owner's call after looking at both sites: in motion graphics the motion is the content, and motionvid shows each example as a use case with a named style, which matches the per-video pack.
- **Rejected:** the `video-editing` reels as the bar (average or below, the owner); interface motion systems as the default reference for motion.

### 2026-10-30 · No shader transitions or GPU effects in v1

- **Decided:** gl-transitions are not used, and v1 has no effect that needs a GPU: no shader transitions, WebGL backgrounds or WebGL 3D. Transitions are cuts and moves in ordinary DOM and SVG: a push with blur, a mask reveal, a zoom into a detail, a card that grows into the frame, a flash cut. Grain, gradients and device mockups use CSS, SVG or pre-rendered textures, and an effect a style needs, such as a glitch, is written in-house.
- **Why:** the owner found the gl-transitions gallery dated, and the reference work uses none of it. Lambda has no GPU and software WebGL there is unmeasured; a GPU machine costs about $380 a month when always on, or a second provider when billed by the second, and renders a video slower than Lambda's chunked rendering.
- **Rejected:** gl-transitions curated to 10–20 (the research's suggestion); GPU effects admitted after a Lambda benchmark; GPU machines outside Lambda.

### 2026-10-30 · A sound-effect layer from CC0 and ElevenLabs sounds

- **Decided:** the video gets a sound-effect track next to the voice and the music, which adds to the spec's audio minimum. It starts with 30–60 core sounds (whoosh, sub-hit, pop, click, riser, impact, ding, typing), curated from Freesound CC0 and generated with ElevenLabs sound effects on a paid plan, kept in Saymo's own storage. Each sound stores the offset of its peak, so a whoosh peaks on the cut. The style of the video sets how many sounds it gets: loud styles put them on cuts and text entrances, calm styles use them rarely or not at all.
- **Why:** the loud styles, now equal options, do not work without sound effects. CC0 needs no attribution, ElevenLabs output is royalty-free on paid plans and the key is already in use; about $7 for 60 generations plus a plan of about $5–6 a month.
- **Rejected:** Epidemic sound effects through the music API (the price is set by their sales team); no sound effects in v1; libraries that require attribution (Zapsplat, CC BY).

### 2026-10-30 · Graphics come from a large vocabulary, not per-video code

- **Decided:** the director keeps choosing and configuring components; the model writes no code per video, as in the 2026-10-28 entry "The model writes data, the engine executes". The vocabulary grows large: from 17 primitives to about a hundred components in the base (the lead's estimate, refined in the design), each with variants, partly ported from HyperFrames, Remocn and Remotion's own packages, and it keeps growing after the base. Variety comes from the size of the library times a choice made per video and per beat from context, and coherence rules keep each video in one style. Loud creator styles (word-by-word captions, whoosh on cuts, punch zooms) and calm ones are equal options chosen by context; neither is the default everywhere. A hybrid, where the model writes code for one or two special moments of a video, may come after v1, once it is clear where the library falls short.
- **Why:** since July 2026 HeyGen's Video Agent writes each graphic as code (HyperFrames), which gives unlimited variety, but every video then costs more and takes longer, its quality varies from run to run, an edit or a format change rewrites code, and the QA checks cannot vouch for arbitrary code. A small library makes videos predictable and boring (the owner); a large one without rules turns into a pile of effects.
- **Rejected:** all graphics as per-video code, as in HeyGen; the hybrid in v1 (outside the v1 scope, kept as a possible step after it); a small vocabulary with one quiet house style.

### 2026-10-30 · Providers and models after the spike

- **Decided:** transcription on ElevenLabs Scribe v2, with Deepgram Nova 3 kept in the code as the reserve (`--transcriber deepgram`); frame descriptions on Claude Sonnet 5.5; face detection on AWS Rekognition. The director stays on Claude Opus 5.5 for now: Opus and Sonnet 5.5 are compared on `runs/face-v2` once the vocabulary base is accepted.
- **Why:** in the spike Scribe read Ukrainian medical speech cleanly where Deepgram misspelled terms, at the same price; Sonnet wrote the same frame notes as Opus at half the cost and goes back to Opus with one env value; Rekognition found the face in 47 of 55 frames and already runs in us-east-1. The two director runs were rendered with different vocabularies and cannot be compared fairly; the owner's own work with Opus went well, Sonnet is untested.
- **Rejected:** Deepgram as the main provider (three times faster, but misspells terms); Opus for frame descriptions (twice the cost for the same notes); an ONNX face model in Node (not needed while Rekognition is enough); choosing the director model now.

### 2026-10-30 · The vocabulary comes before the infrastructure

- **Decided:** the next iteration builds the vocabulary to a solid base, locally, with the Synevo reel from `video-editing/synevo` as the reference; the application, database, queue, storage and deployment (the spec's stage 2) come after it. Stages 1 and 2 of the spec swap places.
- **Why:** the owner's call after the stage 0 review and the design spike: the engine is the product, the first renders with six bare primitives were not something to show, and the vocabulary needs sustained attention that is easier to give before the application exists.
- **Rejected:** finishing the infrastructure first (proposed by the lead, kept as the step right after the vocabulary).

### 2026-10-30 · The vocabulary approach stands after the design spike

- **Decided:** keep building video from data and a vocabulary of components on Remotion. The design spike brought the Synevo talking head from bare primitives to the family of the hand-made reel in one day: rail captions with keywords, chips with badges and motion, title cards and list panels with panel layouts, documents and screens in a card.
- **Why:** the gap the owner saw was an empty vocabulary and no composition layer, not the architecture. Per-video code written by the model stays rejected for the reasons in the design spec.
- **Still open, with the lead's recommendation:** transcription ElevenLabs Scribe v2 (Deepgram misspells Ukrainian terms), frame descriptions on Sonnet 5.5 (same notes at half the cost), the director model (Opus 5.5 keeps the whole talk and asks whether to cut, Sonnet 5.5 cuts boldly at half the cost and time). Measurements in `docs/spike-results.md`.

### 2026-10-30 · AWS runs in a classic account, not in the new "projects" experience

- **Decided:** Saymo uses an AWS account created with Sign up for AWS (advanced), on the Paid plan, in us-east-1. The account from the default sign-up flow is abandoned.
- **Why:** a "project" account is locked to one Region chosen by the owner's address (Stockholm), Rekognition does not exist there, every other Region is denied by an AWS-managed policy, and the account could not activate the advanced features that lift the limits.
- **Consequence:** a brand-new account caps Lambda at 512 MB and 5 concurrent executions; the concurrency increase was requested, Lambda renders wait for it. Details in `docs/runbooks/lambda.md`.

### 2026-10-28 · Keep-out zones and overlay placement on footage

- **Decided:** face keep-out zones are computed per overlay from the faces inside that overlay's own time window, padded by 0.02 and mapped through the scene's crop transform into frame coordinates. Placement takes the first free slot, then scans the safe area vertically, and falls back to the least-overlapping position. QA treats an overlap above 50% of the element as an error and anything smaller as a warning.
- **Why:** a talking head cropped to 9:16 leaves no slot that is completely free of the face and the caption band; an all-or-nothing rule made every such video fail QA. Taken by Claude on the owner's behalf during the stage 0 final review; the owner can tighten the thresholds.
- **Rejected:** any overlap is an error (no video with a face would render); ignoring faces entirely.

### 2026-10-28 · Project language is English

- **Decided:** every file in the repository is written in English: documentation, CLAUDE.md, skills, code comments, commit messages. Conversation with the owner stays in Russian. Files written in Russian before this decision are translated in place (plan Task 17).
- **Why:** the project should be readable by anyone who joins or reviews it.
- **Rejected:** Russian docs with English code only.

### 2026-10-28 · Documentation and Claude tooling in the repository

- **Decided:** documentation as small pages by topic in `docs/`, built into a VitePress site with Mermaid; the user flow diagram as Mermaid, updated in the same commit as the flow; Claude skills in `.claude/skills/`: learn, decision, docs, review, vocab, spike. Everything is set up in stage 0.
- **Why:** the owner wants proper documentation as development goes, a global picture of the user flow for everyone, and for Claude to learn from feedback.
- **Rejected:** one big markdown file; documentation in Notion or Confluence (far from the code, Claude does not maintain it by itself).

### 2026-10-28 · Own video plus graphics becomes the main scenario

- **Decided:** the first version serves uploaded footage first: cuts, zooms, captions, graphics in the brand's style. Text mode stays second. 40-minute podcasts after launch.
- **Why:** the owner wanted from the start an equivalent of their own manual work in `video-editing`; the handoff of October 21 described it inaccurately.
- **Rejected:** text → motion video as the main scenario, own video after launch.

### 2026-10-28 · One variant instead of three

- **Decided:** one generation yields one video.
- **Why:** three variants are three times more expensive and slower; free edits replace choosing by eye.
- **Rejected:** three variants and the Three more versions button.

### 2026-10-28 · The model writes data, the engine executes: a vocabulary of primitives on Remotion

- **Decided:** a video is JSON following our schema; a vocabulary of React components on Remotion assembles the frame; the model picks words from the vocabulary and parameters. A catalog of primitives as an internal page.
- **Why:** edits by click and in words, format changes, the scene editor and the "edits are free" economics only work out with data. The creative work moves into the vocabulary and is done once.
- **Rejected:** the model writes HTML and GSAP for each video (as in `video-editing` on HyperFrames): expensive, slow, edits are brittle, a human in the loop is needed. Our own renderer on Playwright: two to three weeks on what Remotion has already debugged. HyperFrames as a renderer for our data: two representations of one video.

### 2026-10-28 · Rendering on Remotion Lambda from day one

- **Decided:** MP4 files and posters are rendered on Remotion Lambda in our own AWS; storage is S3 with CloudFront. Local rendering with the same code for development and as a fallback.
- **Why:** parallel rendering in seconds, pay per use, the render queue stops being a problem. One adapter, the same video code.
- **Rejected:** rendering in our own container (30–90 seconds, idle machines), rendering in the browser via WebCodecs (immature).

### 2026-10-28 · Deterministic QA in the first version, a critic model later

- **Decided:** after the build and after every edit, checks in code: the text fits, durations add up, contrast, safe zones, face keep-out zones, voice in the scene. A critic model is switched on selectively after the first evals.
- **Why:** the vocabulary holds the baseline quality; without evals it is unclear whether a critic improves videos or adds noise and cost.

### 2026-10-28 · Plan card and questions after the button

- **Decided:** 30–90 seconds after the button a plan always arrives: what it is about, who, where to and the length, beats, assumptions, up to three questions with defaults and a Continue button. No timers. The plan can be edited before the build. The job waits for answers on the server as long as needed, with an email after 10 minutes.
- **Why:** unclear points get clarified without getting in the way; the user knows when to expect a question, because the plan always arrives.
- **Rejected:** auto-continue after 10 seconds, questions before the button.

### 2026-10-28 · "Where to" instead of format and length; the director proposes the length

- **Decided:** a destination chip (Reels / TikTok, Stories, Shorts, LinkedIn / X, YouTube, Just a file) sets the format, the length ceiling, the safe zones and the captions. The director proposes the length within the ceiling based on the content, and it is changed with a Shorter / Longer edit.
- **Limits:** the source up to 10 minutes and 2 GB on Pro, up to 5 minutes and 1 GB on Free; the result up to the length of the source; text mode up to 3 minutes. The plan counts videos, not minutes.
- **Rejected:** choosing the format and length by hand; a result up to 90 seconds.

### 2026-10-28 · Sound in the first version

- **Decided:** music from a licensed library, ElevenLabs voice, captions from word timings. Music generation and a custom audio file right after launch as two sources for a ready-made slot.
- **Why:** voice and captions change the pipeline (scene timing follows the speech), adding them later costs more.

### 2026-10-28 · Stack and hosting

- **Decided:** TypeScript everywhere; Next.js, React 19, Tailwind v4 on the design tokens, Radix; Remotion; Postgres + Drizzle; pg-boss; the worker as a second entry point into the same code; Better Auth (Google and email link); merchant of record (Paddle or Lemon Squeezy); Resend; PostHog and Sentry; next-intl; Anthropic SDK; ElevenLabs; Biome; Vitest and Playwright; pnpm, Node 22; GitHub Actions. Railway for web, worker and Postgres; AWS only for Lambda, S3, CloudFront.
- **Why:** one language and one video code for preview and render; the minimum of services to maintain; everything managed where possible.
- **Rejected:** Python or Go on the server; Vercel AI SDK; everything in AWS; Vercel + Railway + AWS; CSS Modules.

### 2026-10-28 · Market, sign-in, phone, name, price

- **Decided:** the market is English-speaking, the interface is in English, the video is in the language of the request. Sign-in before Home, as in the mockups. Desktop for work, phone for viewing, fluid layouts from day one. The name is Saymo. Pro price $29 as a placeholder until the cost is measured. One person with Claude Code builds the first version.
- **Rejected:** the Russian-speaking market first; Home without sign-in; desktop only.

### 2026-10-21 · Technologies are decided separately

- **Decided:** the documents hold only the product and the design for now. The stack, services and architecture are chosen later together with Claude Code.
- **Why:** first we need to fix what we are building; technical decisions depend on measurements of cost and quality.

### 2026-10-21 · Screen structure of the first version

- **Decided:** 20 screens in six flows plus Foundations (see `design/README.md`).
- **Why:** they cover the main scenario, sign-in, brand, own material, download, review, library and payment.

### 2026-10-06 · Dark style and English interface

- **Decided:** a dark theme, one bright accent, a large dense typeface, Onest. The interface is in English.
- **Why:** videos look brighter on a dark background, the interface steps back. The author's minimalist references: Uncle Rudy and Art-gen.
- **Rejected:** the light, calm style of the first sketch: it looked weak.

### 2026-10-06 · There is a manual editor, but it is hidden

- **Decided:** a simple editor for the order, length and text of scenes, entered through an inconspicuous Editor link.
- **Why:** meticulous users need control, but the main path is edits in words. Layers and keyframes would turn the product back into a complex editor.

### 2026-10-05 · Not "everything for social media at once"

- **Decided:** we launch with one thing: motion videos in the brand's style with edits in words. Voiceover, music and captions come next, auto-posting when asked.
- **Why:** an "everything" all-in-one repeats Higgsfield's main problem, and the field is occupied by Canva, CapCut and post schedulers.
- **Rejected:** a "sound, video, text, auto-posting" service from day one.

### 2026-10-05 · Audience: marketers, not casual users

- **Decided:** marketers and social media managers in small companies, freelancers, including designers without motion skills, small agencies.
- **Why:** they need videos regularly and they pay. A casual user needs a video once a year, pays poorly and leaves quickly.
- **Rejected:** "Higgsfield for the casual user".
