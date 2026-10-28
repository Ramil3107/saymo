# Decision log

Each decision: date, what was decided, why, what was rejected. New entries on top. If a decision changes, the old entry is never deleted. A new entry is written with a link to the old one.

---

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
