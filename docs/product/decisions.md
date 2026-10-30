# Decision log

Each decision: date, what was decided, why, what was rejected. New entries on top. If a decision changes, the old entry is never deleted. A new entry is written with a link to the old one.

---

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
