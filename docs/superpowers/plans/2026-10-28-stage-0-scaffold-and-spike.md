# Stage 0: scaffold and spike. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A repository with rules, skills and a documentation site, plus the `pnpm spike` command, which turns a video or text into a plan, a video document and an MP4 (locally, and once through Lambda) and writes a table of time and cost per step.

**Architecture:** One TypeScript package. `src/video/` knows about the video (schema, registers, Remotion primitives, QA, render) and knows nothing about external services. `src/worker/steps/` holds the pipeline steps (ingest, transcribe, see, direct, voice, build), and each writes an artifact to the run folder. `src/worker/run.ts` runs the steps according to the manifest and restarts from the point of failure. `src/cli/spike.ts` is a thin wrapper over `runPipeline`. Next.js, the database and the queue do not appear in this stage.

**Tech Stack:** Node 22, pnpm, strict TypeScript, Biome, Vitest, tsx, Zod, Remotion 4.x (`remotion`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/media`, `@remotion/captions`, `@remotion/google-fonts`, `@remotion/layout-utils`, `@remotion/lambda`), React 19, `@anthropic-ai/sdk`, `@aws-sdk/client-rekognition`, `@deepgram/sdk`, ElevenLabs over REST through `fetch`, system ffmpeg and ffprobe, VitePress + `vitepress-plugin-mermaid`.

**Spec:** `docs/superpowers/specs/2026-10-28-saymo-v1-design.md` (sections 5, 6, 7, 10, 11, 13 and 16).

## Global Constraints

- Node 22 (`.nvmrc` = `22`), pnpm through corepack, `.npmrc` with `save-exact=true`. All `@remotion/*` packages and `remotion` are on the same version.
- Strict TypeScript, no `any`. Biome clean and Vitest green before every commit. ESM (`"type": "module"`), `__dirname` is not used, paths come from `import.meta.url` or `process.cwd()`.
- Zod at every boundary: env, model output, responses of external APIs, run files.
- Code reads without comments. A comment only where the "why" is not obvious, in one line. No divider headings, TODO or dead code.
- `src/video/` does not import from `src/worker/` or `src/lib/ai`. Pipeline steps do not import each other, only schemas and `src/lib`.
- The default Claude model is `claude-opus-5-5` (`SAYMO_DIRECTOR_MODEL` and `SAYMO_VISION_MODEL` override it for a measurement; the candidates to measure are `claude-sonnet-5-5` for the director and vision, `claude-haiku-5-5` for edits). Thinking is not set (adaptive by default), `output_config.effort` is set explicitly. The server-side fallback is on: `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`. Prefill is not used.
- Every call to the model, transcription, voiceover, detection and render is recorded in the run metrics with milliseconds and dollars.
- Frame format: 9:16 = 1080×1920, 1:1 = 1080×1080, 16:9 = 1920×1080, 30 frames per second.
- Documentation: every task that changes behavior updates a page in `docs/` in the same commit.

## Review Focus

1. A source without speech (silent or music only): the transcript is empty, the director still gives a cutting plan without captions, the build does not fail. Tests in Task 8 (`direct` with `transcript.words = []`) and Task 9 (`buildVideo` without captions).
2. A horizontal source in a vertical video: the footage fills the frame without bars, and if there is a face, the crop shifts so that the face stays in the frame. The `fitCover` test in Task 9.
3. A Russian-language source: the language is detected, captions and headlines with Cyrillic do not break the split into pages, the font loads with `cyrillic`. Tests in Task 9 (Cyrillic in words) and Task 10 (subsets).
4. A 10-minute source: of 300 keyframes, no more than 60 go to description (one per shot plus evenly spaced), in batches of 20, the cost is computed before the call and the run stops if the estimate is above the threshold. Tests `selectFramesForDescription`, `batch` and `estimateVisionUsd` in Task 7.
5. A plan longer than the destination's length ceiling or longer than the source: QA reports an error and the run is marked `qa-failed` instead of being rendered. The `planWithinLimits` test in Task 11.
6. The file is not a video, or ffmpeg is not found: `probe` throws `IngestError` with a clear message before any paid calls. A test in Task 5.

---

## Stage files

```
.nvmrc .npmrc package.json tsconfig.json biome.json vitest.config.ts .env.example
CLAUDE.md
.claude/skills/{learn,decision,docs,review,vocab,spike}/SKILL.md
docs/.vitepress/config.ts  docs/index.md  docs/overview.md  docs/architecture.md  docs/pipeline.md
docs/video-schema.md  docs/vocabulary.md  docs/learnings.md  docs/runbooks/setup.md  docs/runbooks/lambda.md
docs/spike-results.md  (docs/user-flow.md and docs/product/decisions.md already exist)
assets/music/manifest.json
src/lib/env.ts  src/lib/metrics.ts  src/lib/pricing.ts  src/lib/ffmpeg.ts  src/lib/ai/claude.ts  src/lib/html.ts
src/video/schema/{media,transcript,content,plan,video}.ts  src/video/destinations.ts  src/video/registers.ts
src/video/layout/{fitCover,safeZones,textWidth}.ts
src/video/captions/{pages,timeline}.ts  src/video/audio/ducking.ts
src/video/remotion/{index.ts,Root.tsx,SaymoVideo.tsx,fonts.ts}
src/video/remotion/primitives/{Background,Footage,Camera,Headline,Chip,BigNumber,LowerThird,Captions,MusicTrack,VoiceTrack}.tsx
src/video/qa/checks.ts  src/video/render/{renderLocal,renderLambda}.ts
src/worker/steps/ingest.ts  src/worker/steps/transcribe/{types,elevenlabs,deepgram}.ts
src/worker/steps/see/{faces,describe,contentMap}.ts  src/worker/steps/direct/{director,prompts}.ts
src/worker/steps/voice/elevenlabsVoice.ts  src/worker/steps/build/buildVideo.ts
src/worker/{manifest,run}.ts  src/cli/spike.ts
fixtures/{plan.footage.json,plan.text.json,transcript.elevenlabs.json,transcript.deepgram.json,content.sample.json}
```

Tests live next to the code: `foo.ts` → `foo.test.ts`.

---

### Task 1: Package scaffold and environment

**Files:**
- Create: `.nvmrc`, `.npmrc`, `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.env.example`, `src/lib/env.ts`, `src/lib/env.test.ts`
- Modify: `.gitignore` (add `runs/`, `.remotion/`, `docs/.vitepress/cache/`, `docs/.vitepress/dist/`)

**Interfaces:**
- Produces: `loadEnv(source: Record<string, string | undefined> = process.env): Env` in `src/lib/env.ts`, `Env` is the output of the Zod schema: `ANTHROPIC_API_KEY?`, `ELEVENLABS_API_KEY?`, `DEEPGRAM_API_KEY?`, `AWS_REGION` (default `"us-east-1"`), `AWS_ACCESS_KEY_ID?`, `AWS_SECRET_ACCESS_KEY?`, `REMOTION_AWS_ACCESS_KEY_ID?`, `REMOTION_AWS_SECRET_ACCESS_KEY?`, `REMOTION_LAMBDA_FUNCTION_NAME?`, `REMOTION_SERVE_URL?`, `SAYMO_DIRECTOR_MODEL` (default `"claude-opus-5-5"`), `SAYMO_VISION_MODEL` (default `"claude-opus-5-5"`), `SAYMO_VISION_BUDGET_USD` (a number, default `1`). Empty strings count as missing.
- Produces: `requireEnv(env: Env, key: keyof Env): string` throws `Error("Set <KEY> in .env")`.

- [ ] **Step 1: Environment.** Run `nvm install 22 && nvm use 22` (if nvm is missing, install Node 22 from nodejs.org) and `corepack enable && corepack prepare pnpm@latest --activate`. Check: `node -v` prints `v22.`, `pnpm -v` prints a version.

- [ ] **Step 2: Configuration files.** `.nvmrc` = `22`. `.npmrc` = `save-exact=true` and `auto-install-peers=true`. `package.json`: `"name": "saymo"`, `"private": true`, `"type": "module"`, `"engines": {"node": ">=22"}`, scripts `check` = `biome check .`, `format` = `biome check --write .`, `typecheck` = `tsc --noEmit`, `test` = `vitest run`, `test:watch` = `vitest`. `tsconfig.json`: `target ES2022`, `module ESNext`, `moduleResolution Bundler`, `jsx react-jsx`, `strict true`, `noUncheckedIndexedAccess true`, `verbatimModuleSyntax true`, `skipLibCheck true`, `include ["src", "docs/.vitepress"]`. `biome.json`: `recommended` rules, a formatter with two-space indentation and double quotes, `organizeImports` enabled. `vitest.config.ts`: `include: ["src/**/*.test.ts"]`, `environment: "node"`. `.env.example`: all the keys from Interfaces with empty values and default values.

- [ ] **Step 3: Install dependencies.** `pnpm add zod` and `pnpm add -D typescript @biomejs/biome vitest tsx @types/node`. Run `pnpm biome init` only if `biome.json` has not been created by hand yet.

- [ ] **Step 4: Write a failing test** `src/lib/env.test.ts`:

```ts
test("defaults apply when variables are missing", () => {
  const env = loadEnv({});
  expect(env.SAYMO_DIRECTOR_MODEL).toBe("claude-opus-5-5");
  expect(env.AWS_REGION).toBe("us-east-1");
  expect(env.SAYMO_VISION_BUDGET_USD).toBe(1);
});
test("empty string counts as missing", () => {
  expect(loadEnv({ ANTHROPIC_API_KEY: "" }).ANTHROPIC_API_KEY).toBeUndefined();
});
test("requireEnv names the missing key", () => {
  expect(() => requireEnv(loadEnv({}), "ANTHROPIC_API_KEY")).toThrow("Set ANTHROPIC_API_KEY in .env");
});
```

- [ ] **Step 5: Run the test, make sure it fails.** Run: `pnpm test src/lib/env.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 6: Implement `loadEnv` and `requireEnv`** in `src/lib/env.ts` on Zod with `z.preprocess` for empty strings. Loading `.env` into the process is done at the entry points through `process.loadEnvFile(".env")` (Node 22), not in `loadEnv`.

- [ ] **Step 7: Run the test, typecheck and Biome.** Run: `pnpm test && pnpm typecheck && pnpm check`. Expected: all green.

- [ ] **Step 8: Commit.**

```bash
git add -A && git commit -m "chore: package scaffold with typescript, biome, vitest and validated env"
```

---

### Task 2: CLAUDE.md and skills

**Files:**
- Create: `CLAUDE.md`, `.claude/skills/learn/SKILL.md`, `.claude/skills/decision/SKILL.md`, `.claude/skills/docs/SKILL.md`, `.claude/skills/review/SKILL.md`, `.claude/skills/vocab/SKILL.md`, `.claude/skills/spike/SKILL.md`, `docs/learnings.md`
- Modify: `docs/product/00-handoff-readme.md` (as the first line: "Working rules moved to `CLAUDE.md`; this file keeps the glossary").

**Interfaces:** no code.

- [ ] **Step 1: Write `CLAUDE.md`** with the sections in this order: "What this is" (three lines about the product and a link to the spec), "How to work with me" (talk in Russian; the product interface in English; do not change technologies or architecture without an entry in `docs/product/decisions.md`; when documents contradict each other, show it and ask; placeholders in square brackets are open questions), "Code rules" (the nine items of section 11 of the spec, verbatim), "Structure" (the tree from section 9 of the spec with one line per folder), "Commands" (`pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm spike`, `pnpm docs:dev`, `pnpm remotion:studio`), "Skills" (a table of the six skills: name and when to call), "Definition of done" (Biome, typecheck, tests, documentation updated, decision recorded if one was made), "Glossary" (a table of terms from the handoff: video, edit, element, scene, beat, brand, destination, register, limit, review link).

- [ ] **Step 2: Write the six `SKILL.md` files.** Each has the frontmatter `name` and `description` (one line, when to call), then the steps. Contents:
  - `learn`: ask what happened, if not stated; add to `docs/learnings.md` an entry `### <date> · <title>` with the fields "What happened", "Lesson", "Rule" (where to propose it: `CLAUDE.md` or a specific skill); show the diff of the rule and apply it after confirmation; commit `docs: learning <title>`.
  - `decision`: collect the date, "what was decided", "why", "what was rejected"; insert the entry at the top of `docs/product/decisions.md`, under the `---` line; commit `docs: decision <title>`.
  - `docs`: from the diff of the current branch, find the affected areas (`src/video` → `docs/video-schema.md` and `docs/vocabulary.md`, `src/worker` → `docs/pipeline.md`, `src/lib` → `docs/architecture.md`, user flows → `docs/user-flow.md`); update the pages; run `pnpm docs:build`; commit with the prefix `docs:`.
  - `review`: run `pnpm check && pnpm typecheck && pnpm test`; go through the diff with the checklist from "Code rules" (readability, slices do not reach into each other, Zod at the boundaries, no extra queries or heavy imports, tests for logic, strings through localization, styles through tokens, no comments from the AI); output a list of findings with file and line, without fixes.
  - `vocab`: ask for the name and parameters of the primitive; create `src/video/remotion/primitives/<Name>.tsx`, add the Zod schema of the parameters to `src/video/schema/video.ts`, a card to the catalog (when it exists, stage 1) and a test for registers and formats; run a render of a single frame: `pnpm remotion:still`.
  - `spike`: `pnpm spike <path or --text> --to <destination> [--transcriber elevenlabs|deepgram] [--render local|lambda|none]`; after the run, append a row to the table in `docs/spike-results.md` from `runs/<id>/metrics.json`.

- [ ] **Step 3: Create `docs/learnings.md`** with a heading and one line "Entries are added by the `learn` skill, newest on top".

- [ ] **Step 4: Check the frontmatter.** Run: `for f in .claude/skills/*/SKILL.md; do head -4 "$f"; done`. Expected: each file has `---`, `name:`, `description:`.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "docs: CLAUDE.md with code rules and six project skills"
```

---

### Task 3: Documentation site

**Files:**
- Create: `docs/.vitepress/config.ts`, `docs/index.md`, `docs/overview.md`, `docs/architecture.md`, `docs/pipeline.md`, `docs/video-schema.md`, `docs/vocabulary.md`, `docs/runbooks/setup.md`, `docs/runbooks/lambda.md` (a one-line stub "Filled in by Task 15"), `docs/spike-results.md`
- Modify: `package.json` (scripts `docs:dev` = `vitepress dev docs`, `docs:build` = `vitepress build docs`, `docs:preview` = `vitepress preview docs`), `docs/README.md` (add a row about the site and the command).

**Interfaces:** no code.

- [ ] **Step 1: Install.** `pnpm add -D vitepress vitepress-plugin-mermaid mermaid`.

- [ ] **Step 2: Config.** `docs/.vitepress/config.ts` exports `withMermaid(defineConfig({...}))` with `title: "Saymo"`, `lang: "ru-RU"`, `srcExclude: ["design/screens/html/**"]`. Sidebar: Overview (`/overview`), User flow (`/user-flow`), Architecture (`/architecture`), Pipeline (`/pipeline`), Video schema (`/video-schema`), Vocabulary (`/vocabulary`), Decisions (`/product/decisions`), Learnings (`/learnings`), Runbooks (`/runbooks/setup`, `/runbooks/lambda`), Spike (`/spike-results`), Spec (`/superpowers/specs/2026-10-28-saymo-v1-design`). Do not set `ignoreDeadLinks: true`: broken links must break the build.

- [ ] **Step 3: Pages.** Each page is 20–60 lines, a summary of the spec with a link to its section, not a copy:
  - `index.md`: a hero with one phrase about the product and three links (overview, user flow, spec).
  - `overview.md`: what we build, the three entry modes, the main gesture, what is out of scope (sections 1 and 3 of the spec).
  - `architecture.md`: one app and two entry points, the folder tree with their responsibilities, import rules, the stack (sections 9 and 10).
  - `pipeline.md`: job states, ten steps with timing guidelines, a Mermaid diagram of the steps with the parallelism (section 7).
  - `video-schema.md`: what is in the video document, schema rules, registers (section 5). Updated in Task 4.
  - `vocabulary.md`: categories of primitives, the minimum for the first version, where to get them, the rule about the catalog (section 6).
  - `runbooks/setup.md`: Node 22, pnpm, ffmpeg, `.env` from `.env.example`, which keys and where to get them (Anthropic, ElevenLabs, Deepgram, an AWS IAM user with Rekognition and Remotion Lambda permissions).
  - `spike-results.md`: a heading, a description of the five runs (three pieces of footage, two texts) and an empty table with the columns: run, input, destination, transcription (provider, s, $), vision (frames, s, $), director (model, tokens, s, $), build (s), render (where, s, $), total (s, $), eyeball score 1–5, notes.

- [ ] **Step 4: Build.** Run: `pnpm docs:build`. Expected: `build complete` with no dead link errors.

- [ ] **Step 5: Check by eye.** Run: `pnpm docs:preview`, open `/user-flow`: the diagram is rendered, the sidebar is complete.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "docs: vitepress site with topic pages and mermaid"
```

---

### Task 4: Schemas: media, transcript, content map, plan, video document

**Files:**
- Create: `src/video/schema/media.ts`, `src/video/schema/transcript.ts`, `src/video/schema/content.ts`, `src/video/schema/plan.ts`, `src/video/schema/video.ts`, `src/video/destinations.ts`, `src/video/registers.ts`, `src/video/schema/plan.test.ts`, `src/video/schema/video.test.ts`, `fixtures/plan.footage.json`, `fixtures/plan.text.json`
- Modify: `docs/video-schema.md`

**Interfaces:**
- Produces in `media.ts`: `MediaInfoSchema` and the type `MediaInfo = { durationMs: number; width: number; height: number; fps: number; hasAudio: boolean; sizeBytes: number }`.
- Produces in `transcript.ts`: `TranscriptWordSchema` `{ text: string; startMs: number; endMs: number; speaker?: string }`, `TranscriptSchema` `{ language: string; text: string; words: TranscriptWord[] }`, the types `TranscriptWord`, `Transcript`.
- Produces in `content.ts`: `BoxSchema` `{ x: number; y: number; w: number; h: number }` (fractions of the frame, 0..1), `ShotSchema` `{ index: number; startMs: number; endMs: number }`, `FaceBoxSchema` = Box + `{ tMs: number }`, `FrameNoteSchema` `{ tMs: number; description: string; kind: "face" | "screen" | "other"; onScreenText: string[] }`, `ContentMapSchema` `{ source: { path: string } & MediaInfo; shots: Shot[]; faces: FaceBox[]; frames: FrameNote[]; transcript: Transcript | null }`, the types `Box`, `Shot`, `FaceBox`, `FrameNote`, `ContentMap`.
- Produces in `destinations.ts`: `DestinationIdSchema = z.enum(["reels", "stories", "shorts", "linkedin", "youtube", "file"])`, `FormatSchema = z.enum(["9:16", "1:1", "16:9"])`, `destinations: Record<DestinationId, { format: Format; maxLengthMs: number; safeZone: { top: number; bottom: number; left: number; right: number }; captionsDefault: boolean }>` with the values: reels 9:16 180000, stories 9:16 60000, shorts 9:16 180000, linkedin 16:9 600000, youtube 16:9 600000, file 9:16 600000; safeZone for reels/stories/shorts `{ top: 0.14, bottom: 0.22, left: 0.04, right: 0.14 }`, for the others `{ top: 0.05, bottom: 0.05, left: 0.05, right: 0.05 }`; captionsDefault true everywhere except youtube and file. `formatSize(format): { width: number; height: number }` per Global Constraints.
- Produces in `registers.ts`: `RegisterIdSchema = z.enum(["driving-launch", "serious-clinical", "rich-premium", "playful-sale"])`, `registers: Record<RegisterId, RegisterTokens>` where `RegisterTokens = { sceneMs: [number, number]; minHoldMs: number; staggerMs: number; easing: "snap" | "settle" | "drift" | "bounce"; overshoot: number; fontWeight: [number, number]; maxElements: number; maxConcurrentMotions: number; musicBpm: [number, number] }` with the values from the register table of the motion spec (driving-launch: sceneMs [1500, 2500], minHoldMs 700, staggerMs 40, snap, 1.4, [800, 900], 4, 2, [110, 130]; serious-clinical: [3000, 4500], 1200, 80, settle, 0, [500, 700], 3, 1, [70, 90]; rich-premium: [2500, 4000], 1000, 60, drift, 0.6, [600, 800], 5, 2, [80, 100]; playful-sale: [1500, 2500], 700, 50, bounce, 1.8, [800, 900], 6, 3, [120, 140]).
- Produces in `plan.ts`: `BeatRoleSchema = z.enum(["hook", "setup", "message", "proof", "how", "cta", "sting"])`, `OverlayKindSchema = z.enum(["headline", "chip", "big-number", "lower-third", "quote", "sticker"])`, `CameraSchema` `{ kind: "none" | "push" | "punch-in" | "pan"; intensity: number (0..1) }`, `OverlaySchema` `{ id: string; kind: OverlayKind; text: string; sub?: string; atMs: number; durationMs: number; emphasis?: "marker" | "underline" | "pulse" }`, `BeatSchema` `{ id: string; role: BeatRole; startMs: number; durationMs: number; footage?: { fromMs: number; toMs: number }; camera?: Camera; copy?: { headline?: string; sub?: string }; overlays: Overlay[]; voiceText?: string }`, `QuestionSchema` `{ id: string; text: string; options: string[] (2..4); defaultOption: string }`, `PlanSchema` `{ title: string; summary: string; cast: { name: string; role?: string }[]; destination: DestinationId; lengthMs: number; register: RegisterId; musicMood: string; captions: { enabled: boolean; style: "karaoke" | "box" | "pop" }; voiceover: boolean; beats: Beat[] (min 1); assumptions: string[]; questions: Question[] (max 3) }`, the types `Plan`, `Beat`, `Overlay`, `Question`. The `.superRefine` rule: the sum of the beats' `durationMs` equals `lengthMs` with a tolerance of 200, `defaultOption` is one of `options`, the beat ids are unique.
- Produces in `video.ts`: `ElementSchema` as a discriminated union on `kind` ∈ `headline | chip | big-number | lower-third | quote | sticker` with the common fields `{ id: string; enterMs: number; exitMs: number; box: Box; emphasis?: "marker" | "underline" | "pulse" }` and the specific ones: `headline { text: string; sub?: string }`, `chip { text: string }`, `big-number { value: string; label?: string }`, `lower-third { name: string; role?: string }`, `quote { text: string; author?: string }`, `sticker { text: string }`. `SceneSchema` `{ id: string; startMs: number; durationMs: number; background: { kind: "brand" | "solid" | "gradient"; color?: string }; footage?: { assetId: string; fromMs: number; transform: { scale: number; x: number; y: number } }; camera?: Camera; elements: Element[]; transition: "cut" | "fade" | "slide" }`. `CaptionPageSchema` `{ text: string; startMs: number; durationMs: number; tokens: { text: string; fromMs: number; toMs: number }[] }`. `VideoDocSchema` `{ id: string; format: Format; fps: 30; durationMs: number; destination: DestinationId; register: RegisterId; brand: { colors: string[] (1..3); font: string; logo?: string }; assets: { id: string; kind: "video" | "audio" | "image"; src: string; durationMs?: number }[]; scenes: Scene[]; captions?: { style: "karaoke" | "box" | "pop"; pages: CaptionPage[] }; music?: { assetId: string; volume: number; duckTo: number; speech: { startMs: number; endMs: number }[] }; voice: { assetId: string; atMs: number }[] }`, the types `VideoDoc`, `Scene`, `Element`, `CaptionPage`. The rule: scenes follow one another with no gaps or overlaps, and the last one ends at `durationMs`.

- [ ] **Step 1: Write failing tests** `plan.test.ts` and `video.test.ts`:

```ts
test("fixture plans are valid", () => {
  expect(() => PlanSchema.parse(footagePlan)).not.toThrow();
  expect(() => PlanSchema.parse(textPlan)).not.toThrow();
});
test("beats must add up to lengthMs within 200 ms", () => {
  const broken = { ...footagePlan, lengthMs: footagePlan.lengthMs + 1000 };
  expect(PlanSchema.safeParse(broken).success).toBe(false);
});
test("defaultOption must be one of options", () => { /* a question whose default is not in its options does not pass */ });
test("scenes must be contiguous", () => { /* a document with a gap between scenes does not pass */ });
test("formatSize", () => { expect(formatSize("9:16")).toEqual({ width: 1080, height: 1920 }); });
```

- [ ] **Step 2: Fixtures.** `fixtures/plan.footage.json`: a plan of 45 000 ms for `reels`, register `driving-launch`, five beats (hook with footage 12000..15000 and a headline overlay, setup, message with a chip, proof with a big-number "3×", cta with a sticker), `captions.enabled true`, `voiceover false`, one question with a default. `fixtures/plan.text.json`: a plan of 15 000 ms without footage, `voiceover true`, every beat has `voiceText`, `questions []`.

- [ ] **Step 3: Run the tests, make sure they fail.** Run: `pnpm test src/video/schema`. Expected: FAIL.

- [ ] **Step 4: Implement the schemas** per Interfaces. For `fps`, use `z.literal(30)`.

- [ ] **Step 5: Run the tests.** Run: `pnpm test src/video/schema && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Update `docs/video-schema.md`**: a table of the `VideoDoc` fields, a list of element types, a table of destinations, a table of registers.

- [ ] **Step 7: Commit.**

```bash
git add -A && git commit -m "feat(video): zod schemas for media, transcript, content map, plan and video document"
```

---

### Task 5: ffmpeg and ingest

**Files:**
- Create: `src/lib/ffmpeg.ts`, `src/lib/ffmpeg.test.ts`, `src/worker/steps/ingest.ts`, `src/worker/steps/ingest.test.ts`

**Interfaces:**
- Produces in `ffmpeg.ts`: `class IngestError extends Error`; `runFfmpeg(args: string[]): Promise<{ stdout: string; stderr: string }>` (through `node:child_process` `execFile`, `maxBuffer` 64 MB, on a non-zero exit code throws `IngestError` with the tail of stderr); `probe(file: string): Promise<MediaInfo>` (ffprobe `-print_format json -show_streams -show_format`, throws `IngestError("Not a video file: <path>")` if there is no video stream, and `IngestError("ffmpeg is not installed")` if the binary is not found); `makeTestVideo(outPath: string, seconds: number): Promise<void>` (lavfi `testsrc2=size=640x360:rate=30` + `sine=frequency=440`, for tests).
- Produces in `ingest.ts`: `ingest(input: { source: string; runDir: string }): Promise<IngestResult>` where `IngestResult = { info: MediaInfo; audioPath: string; keyframes: { tMs: number; path: string }[]; shots: Shot[] }`; the audio is `audio.wav`, mono, 16 kHz; keyframes `frames/%04d.jpg` every 2000 ms, width 640; shots through the filter `select='gt(scene,0.3)',showinfo`; `parseSceneTimestamps(stderr: string): number[]` extracts `pts_time` from the `showinfo` lines, in milliseconds; `shotsFromCuts(cutsMs: number[], durationMs: number): Shot[]`.

- [ ] **Step 1: Failing tests.**

```ts
test("parseSceneTimestamps reads pts_time from showinfo", () => {
  const stderr = "[Parsed_showinfo_1 @ 0x1] n:0 pts:90000 pts_time:3 ...\n[Parsed_showinfo_1 @ 0x1] n:1 pts:270000 pts_time:9.5 ...";
  expect(parseSceneTimestamps(stderr)).toEqual([3000, 9500]);
});
test("shotsFromCuts covers the whole duration", () => {
  expect(shotsFromCuts([3000, 9500], 12000)).toEqual([
    { index: 0, startMs: 0, endMs: 3000 }, { index: 1, startMs: 3000, endMs: 9500 }, { index: 2, startMs: 9500, endMs: 12000 },
  ]);
});
test("probe rejects a non-video file", async () => {
  await expect(probe("package.json")).rejects.toThrow("Not a video file");
});
test("ingest extracts audio, keyframes and shots from a synthetic video", async () => {
  await makeTestVideo(src, 6);
  const result = await ingest({ source: src, runDir });
  expect(result.info.durationMs).toBeGreaterThanOrEqual(5900);
  expect(result.keyframes.map((k) => k.tMs)).toEqual([0, 2000, 4000]);
  expect(result.shots.at(-1)?.endMs).toBe(result.info.durationMs);
});
```

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/lib/ffmpeg src/worker/steps/ingest`. Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces. Duration from `format.duration`, fps from `r_frame_rate` of the video stream.

- [ ] **Step 4: Run the tests.** Run: `pnpm test src/lib/ffmpeg src/worker/steps/ingest`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(worker): ffmpeg helpers and ingest step"
```

---

### Task 6: Transcription: ElevenLabs and Deepgram

**Files:**
- Create: `src/worker/steps/transcribe/types.ts`, `src/worker/steps/transcribe/elevenlabs.ts`, `src/worker/steps/transcribe/deepgram.ts`, `src/worker/steps/transcribe/normalize.test.ts`, `src/lib/pricing.ts`, `src/lib/metrics.ts`, `src/lib/metrics.test.ts`, `fixtures/transcript.elevenlabs.json`, `fixtures/transcript.deepgram.json`

**Interfaces:**
- Produces in `pricing.ts`: `claudeUsd(model: string, usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }): number` with a table per million tokens (input / output / cache read / cache write): `claude-opus-5-5` 4 / 20 / 0.2 / 5; `claude-sonnet-5-5` 2 / 10 / 0.2 / 2.5; `claude-haiku-5-5` 0.1 / 0.5 / 0.01 / 0.125; an unknown model throws `Error("No price for model <id>")`. The constants `ELEVENLABS_STT_USD_PER_MIN = 0.0067`, `DEEPGRAM_USD_PER_MIN = 0.0077`, `ELEVENLABS_TTS_USD_PER_1K_CHARS = 0.3`, `REKOGNITION_USD_PER_IMAGE = 0.001`, each with the field `note: "estimate, check the dashboard"` in the `pricingNotes` object.
- Produces in `metrics.ts`: `type UsageEvent = { step: string; provider: "anthropic" | "elevenlabs" | "deepgram" | "rekognition" | "lambda" | "ffmpeg"; ms: number; usd: number; detail?: Record<string, number | string> }`; `class Metrics { record(event: UsageEvent): void; total(): { ms: number; usd: number }; byStep(): Record<string, { ms: number; usd: number }>; toJSON(): UsageEvent[]; static from(events: UsageEvent[]): Metrics }`; `timed<T>(metrics: Metrics, step: string, provider: UsageEvent["provider"], fn: () => Promise<{ value: T; usd: number; detail?: UsageEvent["detail"] }>): Promise<T>`.
- Produces in `types.ts`: `interface Transcriber { name: "elevenlabs" | "deepgram"; transcribe(audioPath: string, durationMs: number): Promise<{ transcript: Transcript; usd: number }> }`.
- Produces in `elevenlabs.ts`: `ElevenLabsSttResponseSchema` (the fields `language_code`, `text`, `words[]` with `text`, `start`, `end`, `type` ∈ `word | spacing | audio_event`, `speaker_id?`), `normalizeElevenLabs(res: ElevenLabsSttResponse): Transcript` (takes only `type === "word"`, seconds to milliseconds, `speaker_id` to `speaker`), `elevenLabsTranscriber(apiKey: string): Transcriber` (POST `https://api.elevenlabs.io/v1/speech-to-text`, multipart `FormData` with `file`, `model_id=scribe_v2`, `timestamps_granularity=word`, `diarize=true`, the header `xi-api-key`; cost `durationMs / 60000 * ELEVENLABS_STT_USD_PER_MIN`).
- Produces in `deepgram.ts`: `normalizeDeepgram(res: unknown): Transcript` (Zod on the path `results.channels[0].alternatives[0]` with `transcript`, `words[]` `{ word, punctuated_word?, start, end, speaker? }`, the language from `results.channels[0].detected_language` or `"unknown"`), `deepgramTranscriber(apiKey: string): Transcriber` (`new DeepgramClient({ apiKey })`, `listen.v1.media.transcribeFile(createReadStream(audioPath), { model: "nova-3", smart_format: true, diarize: true, detect_language: true })`).

- [ ] **Step 1: Fixtures.** Two JSON responses of ten words each, including a word in Cyrillic and a pause (`spacing`) in the ElevenLabs one, two speakers in both.

- [ ] **Step 2: Failing tests.**

```ts
test("normalizeElevenLabs keeps words only and converts to ms", () => {
  const t = normalizeElevenLabs(elevenFixture);
  expect(t.words).toHaveLength(10);
  expect(t.words[0]).toEqual({ text: "Привет", startMs: 120, endMs: 480, speaker: "speaker_0" });
});
test("normalizeDeepgram prefers punctuated words", () => {
  expect(normalizeDeepgram(deepgramFixture).words[2]?.text).toBe("month.");
});
test("claudeUsd prices opus 5.5 with cache reads", () => {
  expect(claudeUsd("claude-opus-5-5", { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 10000 })).toBeCloseTo(0.004 + 0.01 + 0.002, 6);
});
test("Metrics sums by step", () => { /* two records in one step add up */ });
```

- [ ] **Step 3: Run the tests, make sure they fail.** Run: `pnpm test src/worker/steps/transcribe src/lib/metrics`. Expected: FAIL.

- [ ] **Step 4: Install** `pnpm add @deepgram/sdk`. Implement per Interfaces. Network functions are not unit tested.

- [ ] **Step 5: Run the tests.** Run: `pnpm test src/worker/steps/transcribe src/lib/metrics && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(worker): transcription via elevenlabs scribe and deepgram, pricing and metrics"
```

---

### Task 7: Frame understanding: faces and descriptions

**Files:**
- Create: `src/lib/ai/claude.ts`, `src/worker/steps/see/faces.ts`, `src/worker/steps/see/faces.test.ts`, `src/worker/steps/see/describe.ts`, `src/worker/steps/see/describe.test.ts`, `src/worker/steps/see/contentMap.ts`

**Interfaces:**
- Produces in `claude.ts`: `createClaude(apiKey: string): Anthropic` (`new Anthropic({ apiKey })`); `withFallback = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as const`; `textOf(message: Anthropic.Beta.BetaMessage): string` (joins the text blocks); `assertNotRefused(message)` throws `Error("Claude refused: <category>")` when `stop_reason === "refusal"`.
- Produces in `faces.ts`: `interface FaceDetector { detect(frame: { tMs: number; path: string }): Promise<FaceBox[]> }`; `rekognitionDetector(region: string): FaceDetector` (`DetectFacesCommand({ Image: { Bytes }, Attributes: ["DEFAULT"] })`, `BoundingBox.Left/Top/Width/Height` into `x/y/w/h`); `detectFaces(detector, frames, metrics): Promise<FaceBox[]>` (sequentially, cost `frames.length * REKOGNITION_USD_PER_IMAGE`); `avoidZones(faces: FaceBox[], interval: { startMs: number; endMs: number }, padding = 0.04): Box[]` (the union of the rectangles with `tMs` inside the interval, expanded by `padding`, merged if they intersect).
- Produces in `describe.ts`: `selectFramesForDescription(frames: { tMs: number; path: string }[], shots: Shot[], max = 60): typeof frames` (first the frame nearest to the start of each shot, then evenly in time up to `max`, without repeats, in ascending `tMs`); `batch<T>(items: T[], size: number): T[][]`; `estimateVisionUsd(frameCount: number, model: string): number` (1 600 tokens per 640 px frame at the model's input price plus 200 output tokens per frame); `describeKeyframes(input: { client: Anthropic; model: string; frames: { tMs: number; path: string }[]; budgetUsd: number; metrics: Metrics }): Promise<FrameNote[]>` (batches of 20 frames, one batch = one call to `client.beta.messages.create` with `...withFallback`, `output_config: { effort: "low", format: zodOutputFormat(z.object({ frames: z.array(FrameNoteSchema) })) }`, `max_tokens: 16000`, images as `image/jpeg` base64, the request text asks to describe each frame by its index and time; the result is parsed with Zod; when `estimateVisionUsd > budgetUsd` it throws `Error("Vision budget exceeded: <est> > <budget>")` before the first call).
- Produces in `contentMap.ts`: `buildContentMap(input: { source: string; info: MediaInfo; shots: Shot[]; faces: FaceBox[]; frames: FrameNote[]; transcript: Transcript | null }): ContentMap`.

- [ ] **Step 1: Failing tests.**

```ts
test("avoidZones merges overlapping boxes inside the interval", () => {
  const faces = [{ tMs: 1000, x: 0.3, y: 0.2, w: 0.2, h: 0.3 }, { tMs: 3000, x: 0.35, y: 0.25, w: 0.2, h: 0.3 }, { tMs: 9000, x: 0.8, y: 0.1, w: 0.1, h: 0.1 }];
  const zones = avoidZones(faces, { startMs: 0, endMs: 5000 }, 0);
  expect(zones).toEqual([{ x: 0.3, y: 0.2, w: 0.25, h: 0.35 }]);
});
test("batch splits 300 frames into 15 calls", () => { expect(batch(Array(300).fill(0), 20)).toHaveLength(15); });
test("selectFramesForDescription keeps one frame per shot and caps at 60", () => {
  const frames = Array.from({ length: 300 }, (_, i) => ({ tMs: i * 2000, path: `${i}.jpg` }));
  const shots = [{ index: 0, startMs: 0, endMs: 7000 }, { index: 1, startMs: 7000, endMs: 600000 }];
  const picked = selectFramesForDescription(frames, shots);
  expect(picked).toHaveLength(60);
  expect(picked.map((f) => f.tMs)).toContain(6000);
});
test("estimateVisionUsd for 300 frames on opus 5.5", () => {
  expect(estimateVisionUsd(300, "claude-opus-5-5")).toBeCloseTo(300 * (1600 * 4 + 200 * 20) / 1e6, 6);
});
test("describeKeyframes refuses to start above budget", async () => {
  await expect(describeKeyframes({ client: {} as Anthropic, model: "claude-opus-5-5", frames: Array(300).fill({ tMs: 0, path: "x" }), budgetUsd: 0.5, metrics })).rejects.toThrow("Vision budget exceeded");
});
```

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/worker/steps/see`. Expected: FAIL.

- [ ] **Step 3: Install** `pnpm add @anthropic-ai/sdk @aws-sdk/client-rekognition`. Implement per Interfaces. `zodOutputFormat` is imported from `@anthropic-ai/sdk/helpers/zod`.

- [ ] **Step 4: Run the tests.** Run: `pnpm test src/worker/steps/see && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(worker): face detection, keyframe descriptions and content map"
```

---

### Task 8: Director

**Files:**
- Create: `src/worker/steps/direct/prompts.ts`, `src/worker/steps/direct/prompts.test.ts`, `src/worker/steps/direct/director.ts`, `src/worker/steps/direct/director.test.ts`, `src/lib/html.ts`, `src/lib/html.test.ts`, `fixtures/content.sample.json`

**Interfaces:**
- Consumes: `PlanSchema`, `ContentMap`, `destinations`, `registers`, `createClaude`, `withFallback`, `Metrics`, `claudeUsd`.
- Produces in `html.ts`: `pageText(html: string, maxChars = 8000): string` (removes `script`, `style`, tags, collapses whitespace, truncates); `fetchPageText(url: string): Promise<string>`.
- Produces in `prompts.ts`: `directorSystemPrompt(): string` (a stable string without dates: the director's role, the three modes, the vocabulary of stage 0 primitives with their fields, a table of destinations and safe zones, a table of registers, the rules: the sum of the beats equals the length, no empty frame in the first second, no more than `maxElements` per beat, no more than 6 words on screen, questions only about what changes the result and cannot be guessed, no more than three, each with a default; the copy language equals the language of the source or the request; with an empty transcript the plan is built from the frames and without captions); `directorUserMessage(input: DirectorInput): string` where `DirectorInput = { mode: "footage" | "text"; destination: DestinationId; content?: ContentMap; text?: string; pageText?: string; brand?: { colors: string[]; font: string } }` (the transcript as words with a timecode once per sentence, shots, frame notes, faces as "a person in the frame from … to …", the destination's length ceiling, the source length).
- Rule for structured output: count constraints (`min`, `max`, array lengths) live in `superRefine`, not in the JSON schema that `zodOutputFormat` builds; if the API rejects the schema, remove the disputed constraint from it and check it in `superRefine`.
- Produces in `director.ts`: `direct(input: DirectorInput, deps: { client: Anthropic; model: string; metrics: Metrics }): Promise<Plan>`: `client.beta.messages.create` with `...withFallback`, `model`, `max_tokens: 16000`, `output_config: { effort: "high", format: zodOutputFormat(PlanSchema) }`, `system: [{ type: "text", text: directorSystemPrompt(), cache_control: { type: "ephemeral" } }]`, `messages: [{ role: "user", content: directorUserMessage(input) }]`; `assertNotRefused`; the text is parsed with `JSON.parse` and `PlanSchema.parse`; on a schema error, one retry with the error text in the next user message; a metric `step: "direct"` with the tokens and `claudeUsd`.

- [ ] **Step 1: Failing tests.**

```ts
test("pageText strips scripts and collapses whitespace", () => {
  expect(pageText("<html><script>x()</script><p>Reports,\n\n  now in PDF</p></html>")).toBe("Reports, now in PDF");
});
test("directorSystemPrompt is stable between calls", () => { expect(directorSystemPrompt()).toBe(directorSystemPrompt()); });
test("directorUserMessage says there is no speech when transcript is empty", () => {
  const content = { ...sampleContent, transcript: { language: "en", text: "", words: [] } };
  expect(directorUserMessage({ mode: "footage", destination: "reels", content })).toContain("no speech");
});
test("direct retries once on a schema error and records metrics", async () => {
  const client = fakeClaude([invalidPlanText, validPlanText]);
  const plan = await direct({ mode: "text", destination: "reels", text: "Reports now export to PDF" }, { client, model: "claude-opus-5-5", metrics });
  expect(plan.beats.length).toBeGreaterThan(0);
  expect(metrics.byStep().direct.usd).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Fixture** `fixtures/content.sample.json`: a content map of a 48-second interview with four shots, a face in the left third and a 60-word transcript.

- [ ] **Step 3: Run the tests, make sure they fail.** Run: `pnpm test src/worker/steps/direct src/lib/html`. Expected: FAIL.

- [ ] **Step 4: Implement** per Interfaces. The fake client in the tests is an object with `beta.messages.create` that returns responses from a queue.

- [ ] **Step 5: Run the tests.** Run: `pnpm test src/worker/steps/direct src/lib/html && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(worker): director step with structured plan output and cached system prompt"
```

---

### Task 9: Build: plan to video document

**Files:**
- Create: `src/video/layout/fitCover.ts`, `src/video/layout/fitCover.test.ts`, `src/video/layout/safeZones.ts`, `src/video/layout/safeZones.test.ts`, `src/video/captions/timeline.ts`, `src/video/captions/pages.ts`, `src/video/captions/pages.test.ts`, `src/video/audio/ducking.ts`, `src/video/audio/ducking.test.ts`, `src/worker/steps/build/buildVideo.ts`, `src/worker/steps/build/buildVideo.test.ts`, `assets/music/manifest.json`

**Interfaces:**
- Consumes: `Plan`, `ContentMap`, `VideoDocSchema`, `destinations`, `formatSize`, `registers`, `avoidZones`, `createTikTokStyleCaptions` from `@remotion/captions`.
- Produces in `fitCover.ts`: `fitCover(source: { width: number; height: number }, target: { width: number; height: number }, focus?: { x: number; y: number }): { scale: number; x: number; y: number }` (scale = max over the axes, the shift centers, with `focus` the shift puts the focus point at the center but no further than the edges).
- Produces in `safeZones.ts`: `placeOverlay(kind: OverlayKind, format: Format, safeZone: Destination["safeZone"], avoid: Box[]): Box`. Candidates in order, the first one that does not intersect `avoid` is taken, otherwise the first: headline `[top-center, bottom-center, middle-center]`; chip and lower-third `[bottom-left, bottom-right, top-left, top-right]`; big-number and quote `[middle-center, top-center, bottom-center]`; sticker `[top-right, top-left]`. All slots are inside `safeZone`. The slot width is 0.84 of the width inside the safe zone for headline and quote, 0.6 for the others; the height is 0.18 for headline, 0.12 for quote and big-number, 0.08 for chip, lower-third and sticker.
- Produces in `timeline.ts`: `rebaseWords(words: TranscriptWord[], footage: { fromMs: number; toMs: number }, sceneStartMs: number): TranscriptWord[]` (the words inside the interval, with time shifted by `sceneStartMs - fromMs`).
- Produces in `pages.ts`: `captionPages(words: TranscriptWord[], combineWithinMs = 1200): CaptionPage[]` through `createTikTokStyleCaptions({ captions: words.map(...), combineTokensWithinMilliseconds })` with `Caption = { text: " " + word, startMs, endMs, timestampMs: null, confidence: null }`.
- Produces in `ducking.ts`: `speechIntervals(words: TranscriptWord[], gapMs = 300): { startMs: number; endMs: number }[]`; `musicVolumeAt(ms: number, speech: { startMs: number; endMs: number }[], base = 0.9, duckTo = 0.25, rampMs = 200): number`.
- Produces in `buildVideo.ts`: `type BuildAssets = { sourceVideo?: { path: string; info: MediaInfo }; music?: { path: string; durationMs: number }; voice?: { beatId: string; path: string; durationMs: number; words: TranscriptWord[] }[] }`; `buildVideo(plan: Plan, content: ContentMap | null, assets: BuildAssets, brand: VideoDoc["brand"]): VideoDoc` (one scene per beat with the same `id`; elements from overlays with the id `${beatId}-${overlayId}`; footage with `fitCover` and the focus on the center of the scene's faces; captions from `rebaseWords` across all scenes with footage, and in text mode from the words of the voiceover; music from `assets.music` with `speech` from `speechIntervals`; the voice per scene with `atMs = scene.startMs`; with `voice` a scene's duration is no less than the voiceover's duration plus 300 ms, the other scenes shrink proportionally so that the sum stays equal to `plan.lengthMs`; the result passes `VideoDocSchema.parse`); `pickMusic(manifest, mood: string): { path; durationMs } | undefined`.
- `assets/music/manifest.json`: `{ "tracks": [] }`, and the file's README line (the `note` field) says that the owner adds the tracks with the fields `file, title, mood, bpm, license, source`.

- [ ] **Step 1: Failing tests.**

```ts
test("fitCover fills 9:16 from 16:9 and keeps the face in frame", () => {
  const t = fitCover({ width: 1920, height: 1080 }, { width: 1080, height: 1920 }, { x: 0.2, y: 0.5 });
  expect(t.scale).toBeCloseTo(1920 / 1080, 4);
  expect(t.x).toBeLessThanOrEqual(0);
  expect(t.x).toBeGreaterThanOrEqual(1080 - 1920 * t.scale);
});
test("placeOverlay moves a chip away from a face", () => {
  const box = placeOverlay("chip", "9:16", destinations.reels.safeZone, [{ x: 0.05, y: 0.6, w: 0.5, h: 0.35 }]);
  expect(box.x).toBeGreaterThan(0.5);
});
test("rebaseWords shifts footage time to scene time", () => {
  expect(rebaseWords([{ text: "a", startMs: 12500, endMs: 12900 }], { fromMs: 12000, toMs: 15000 }, 3000)).toEqual([{ text: "a", startMs: 3500, endMs: 3900 }]);
});
test("captionPages handles cyrillic and groups within 1200 ms", () => {
  const pages = captionPages([{ text: "Привет", startMs: 0, endMs: 300 }, { text: "мир", startMs: 400, endMs: 700 }, { text: "дальше", startMs: 2500, endMs: 2900 }]);
  expect(pages).toHaveLength(2);
  expect(pages[0]?.text.trim()).toBe("Привет мир");
});
test("musicVolumeAt ducks during speech and ramps", () => {
  const speech = [{ startMs: 1000, endMs: 3000 }];
  expect(musicVolumeAt(0, speech)).toBe(0.9);
  expect(musicVolumeAt(2000, speech)).toBe(0.25);
  expect(musicVolumeAt(900, speech)).toBeGreaterThan(0.25);
});
test("buildVideo from the footage plan is a valid document", () => {
  const doc = buildVideo(footagePlan, sampleContent, { sourceVideo: { path: "in.mp4", info: sampleContent.source } }, brand);
  expect(doc.durationMs).toBe(45000);
  expect(doc.scenes.map((s) => s.id)).toEqual(footagePlan.beats.map((b) => b.id));
  expect(doc.captions?.pages.length).toBeGreaterThan(0);
});
test("buildVideo without speech has no captions and does not throw", () => { /* transcript.words = [] */ });
test("buildVideo stretches a scene to fit its voice and keeps the total", () => { /* a text plan, a 4000 ms voice in a 2000 ms scene, the total stays 15000 */ });
```

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/video src/worker/steps/build`. Expected: FAIL.

- [ ] **Step 3: Install Remotion** with one command, all on the same version: `pnpm add remotion@latest @remotion/cli@latest @remotion/bundler@latest @remotion/renderer@latest @remotion/media@latest @remotion/captions@latest @remotion/google-fonts@latest @remotion/layout-utils@latest @remotion/lambda@latest react@latest react-dom@latest` and `pnpm add -D @types/react @types/react-dom`. Check: `grep '"@remotion/' package.json` shows the same version everywhere.

- [ ] **Step 4: Implement** per Interfaces.

- [ ] **Step 5: Run the tests.** Run: `pnpm test src/video src/worker/steps/build && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(video): layout, captions, ducking and plan-to-document build"
```

---

### Task 10: Remotion composition and primitives

**Files:**
- Create: `src/video/remotion/index.ts`, `src/video/remotion/Root.tsx`, `src/video/remotion/SaymoVideo.tsx`, `src/video/remotion/fonts.ts`, `src/video/remotion/sample.test.ts`, `src/video/remotion/primitives/Background.tsx`, `Footage.tsx`, `Camera.tsx`, `Headline.tsx`, `Chip.tsx`, `BigNumber.tsx`, `LowerThird.tsx`, `Captions.tsx`, `MusicTrack.tsx`, `VoiceTrack.tsx`, `src/video/remotion/frames.ts`, `src/video/remotion/frames.test.ts`, `remotion.config.ts`, `fixtures/video.sample.json`
- Modify: `package.json` (scripts `remotion:studio` = `remotion studio src/video/remotion/index.ts`, `remotion:still` = `remotion still src/video/remotion/index.ts saymo --props=fixtures/video.sample.json --frame=45 runs/still.png`, `remotion:render` = `remotion render src/video/remotion/index.ts saymo --props=fixtures/video.sample.json runs/sample.mp4`)

**Interfaces:**
- Consumes: `VideoDoc`, `formatSize`, `registers`, `musicVolumeAt`.
- Produces in `frames.ts`: `msToFrame(ms: number, fps = 30): number` (rounding), `frameToMs`.
- Produces in `fonts.ts`: `loadBrandFont(family: string): { fontFamily: string }` through `@remotion/google-fonts/Onest` `loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "cyrillic"] })`; for stage 0 only Onest is supported, any other family falls back to Onest.
- Produces in `Root.tsx`: `<Composition id="saymo" component={SaymoVideo} defaultProps={sampleDoc} calculateMetadata={...} />`, where `calculateMetadata` takes `fps`, `durationInFrames = msToFrame(durationMs)`, `width/height = formatSize(format)` from the props.
- Produces in `SaymoVideo.tsx`: `SaymoVideo({ doc }: { doc: VideoDoc })`: scenes as `<Sequence from durationInFrames>`, inside them `Background`, `Footage` (if present), `Camera` wraps the content, elements by `kind`, after the scenes `Captions`, `MusicTrack`, `VoiceTrack`. Every element gets `data-element-id={element.id}` on its root div.
- Primitives: `Footage` uses `<Video>` from `@remotion/media` with `src`, `trimBefore={msToFrame(fromMs)}`, `durationInFrames`, `muted={false}`, the style `transform: scale(...) translate(...)` from `transform`; `Camera` for `push` smoothly grows the scale from 1 to `1 + 0.08 * intensity` over the scene, `punch-in` jumps to `1 + 0.15 * intensity` at the start, `pan` shifts x by `4% * intensity`; the text primitives use the register for the font weight and `interpolate`/`spring` for the entrance (mask up over `staggerMs * 6` ms) and `fitText` from `@remotion/layout-utils` to fit the size into `box`; `Captions` draws a page in the lower part of the frame, the bottom edge at `1 - safeZone.bottom - 0.02` of the height, for `karaoke` the active token in the brand color `colors[1] ?? colors[0]`, for `box` a plate, for `pop` the active token enlarged; `MusicTrack` is an `<Audio>` with `volume={(f) => musicVolumeAt(frameToMs(f), speech, volume, duckTo)}`; `VoiceTrack` is an `<Audio>` at `atMs`.
- `index.ts`: `registerRoot(Root)`.
- `remotion.config.ts`: `Config.setVideoImageFormat("jpeg")`, `Config.setOverwriteOutput(true)`.

- [ ] **Step 1: Fixture** `fixtures/video.sample.json`: a document of 15 s, 9:16, `reels`, `driving-launch`, brand `{ colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"], font: "Onest" }`, three scenes with the same ids as the beats of `fixtures/plan.text.json` (headline; chip and big-number; sticker), no footage, no music, no voice, `karaoke` captions of three pages with two to three tokens each.

- [ ] **Step 2: Failing tests.** `frames.test.ts`: `msToFrame(1000)` = 30, `msToFrame(1016)` = 30, `msToFrame(1017)` = 31 (rounding to the nearest). `sample.test.ts`: `VideoDocSchema.parse(sampleDoc)` does not throw, `sampleDoc.durationMs` = 15000, `sampleDoc.captions.pages` has three pages. The fixture is written by hand following the schema from Task 4.

- [ ] **Step 3: Run the tests, make sure they fail.** Run: `pnpm test src/video/remotion`. Expected: FAIL.

- [ ] **Step 4: Implement** per Interfaces.

- [ ] **Step 5: Single frame.** Run: `pnpm remotion:still`. Expected: `runs/still.png` exists, it shows the headline from the fixture in the brand colors, with no text running out of the frame (check by eye).

- [ ] **Step 6: Render the fixture.** Run: `pnpm remotion:render`. Expected: `runs/sample.mp4` is 15 seconds long, `ffprobe` shows 1080×1920 and 30 fps.

- [ ] **Step 7: Run the tests and typecheck.** Run: `pnpm test && pnpm typecheck && pnpm check`. Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add -A && git commit -m "feat(video): remotion composition with footage, text, captions and audio primitives"
```

---

### Task 11: Document QA

**Files:**
- Create: `src/video/layout/textWidth.ts`, `src/video/layout/textWidth.test.ts`, `src/video/qa/checks.ts`, `src/video/qa/checks.test.ts`

**Interfaces:**
- Consumes: `VideoDoc`, `Plan`, `destinations`, `registers`, `formatSize`.
- Produces in `textWidth.ts`: `estimateTextWidth(text: string, fontSizePx: number): number` (0.58 · size per Latin character, 0.64 per Cyrillic one, 0.3 per space); `fitsInBox(text: string, box: Box, format: Format, maxLines: number, fontSizePx: number): boolean`.
- Produces in `checks.ts`: `type QaIssue = { code: "scenes-sum" | "min-hold" | "words-on-screen" | "text-overflow" | "safe-zone" | "avoid-zone" | "voice-overflow" | "plan-over-cap" | "plan-over-source"; severity: "error" | "warning"; message: string; sceneId?: string; elementId?: string }`; `type QaReport = { ok: boolean; issues: QaIssue[] }`; `planWithinLimits(plan: Plan, sourceDurationMs: number | null): QaIssue[]`; `runQa(doc: VideoDoc, plan: Plan, avoid: Record<string, Box[]>, sourceDurationMs: number | null): QaReport` (`ok` = there are no issues with `severity: "error"`; words-on-screen counts the words of all visible elements of the scene against 6, error; min-hold against `registers[doc.register].minHoldMs`, warning; safe-zone checks that the element's `box` is inside the destination's `safeZone`, error; avoid-zone checks the intersection of `box` with `avoid[sceneId]`, error; text-overflow through `fitsInBox` with 2 lines and a size of 72 px for headline, 40 for the others, warning; voice-overflow if the voiceover is longer than the scene, error).

- [ ] **Step 1: Failing tests.**

```ts
test("planWithinLimits flags a plan longer than the destination cap", () => {
  const plan = { ...footagePlan, lengthMs: 200000, beats: [{ ...footagePlan.beats[0], durationMs: 200000 }] };
  expect(planWithinLimits(plan, 600000).map((i) => i.code)).toContain("plan-over-cap");
});
test("planWithinLimits flags a plan longer than the source", () => {
  expect(planWithinLimits(footagePlan, 30000).map((i) => i.code)).toContain("plan-over-source");
});
test("runQa passes the fixture document", () => {
  expect(runQa(sampleDoc, textPlan, {}, null).ok).toBe(true);
});
test("runQa flags an element inside an avoid zone", () => {
  const avoid = { [sampleDoc.scenes[0].id]: [sampleDoc.scenes[0].elements[0].box] };
  expect(runQa(sampleDoc, textPlan, avoid, null).issues.map((i) => i.code)).toContain("avoid-zone");
});
test("runQa flags seven words on screen", () => { /* an element with seven words gives words-on-screen */ });
test("estimateTextWidth is wider for cyrillic", () => { expect(estimateTextWidth("Привет", 72)).toBeGreaterThan(estimateTextWidth("Hello!", 72)); });
```

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/video/qa src/video/layout/textWidth`. Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run the tests.** Run: `pnpm test src/video/qa src/video/layout/textWidth && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(video): deterministic qa checks for documents and plans"
```

---

### Task 12: Local render and poster

**Files:**
- Create: `src/video/render/renderLocal.ts`, `src/video/render/renderLocal.test.ts`, `src/cli/renderFixture.ts`
- Modify: `package.json` (script `render:fixture` = `tsx src/cli/renderFixture.ts`)

**Interfaces:**
- Consumes: `VideoDoc`, `msToFrame`, `@remotion/bundler` `bundle`, `@remotion/renderer` `selectComposition`, `renderMedia`, `renderStill`.
- Produces: `bundleOnce(): Promise<string>` (bundles `src/video/remotion/index.ts` into `.remotion/bundle`, cached in the process memory); `renderLocal(doc: VideoDoc, outPath: string): Promise<{ ms: number }>` (`selectComposition({ serveUrl, id: "saymo", inputProps: { doc } })`, `renderMedia({ composition, serveUrl, codec: "h264", outputLocation: outPath, inputProps: { doc } })`); `renderPoster(doc: VideoDoc, outPath: string, atMs: number): Promise<void>` (`renderStill` with `frame: msToFrame(atMs)`, format `jpeg`); `posterTimeMs(doc: VideoDoc): number` (the middle of the first scene with a `headline` element, otherwise the middle of the first scene).

- [ ] **Step 1: Failing test** `renderLocal.test.ts` for `posterTimeMs` only: for `sampleDoc` it returns the middle of the first scene with a headline.

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/video/render`. Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Check with a render.** `src/cli/renderFixture.ts` reads `fixtures/video.sample.json`, validates it with `VideoDocSchema`, calls `renderLocal` into `runs/render-test/out.mp4` and `renderPoster` into `runs/render-test/poster.jpg` at `posterTimeMs`, and prints the milliseconds. Run: `pnpm render:fixture`. Expected: both files exist, the render time is printed.

- [ ] **Step 5: Run the tests.** Run: `pnpm test src/video/render && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(video): local render and poster frame"
```

---

### Task 13: ElevenLabs voiceover with timings

**Files:**
- Create: `src/worker/steps/voice/elevenlabsVoice.ts`, `src/worker/steps/voice/elevenlabsVoice.test.ts`

**Interfaces:**
- Consumes: `TranscriptWord`, `ELEVENLABS_TTS_USD_PER_1K_CHARS`, `Metrics`.
- Produces: `ElevenLabsTtsResponseSchema` (`audio_base64`, `alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } | null`); `wordsFromAlignment(alignment): TranscriptWord[]` (characters are grouped by spaces; a word's time runs from its first to its last character, in milliseconds); `synthesizeVoice(input: { apiKey: string; voiceId: string; text: string; outPath: string; metrics: Metrics }): Promise<{ path: string; durationMs: number; words: TranscriptWord[] }>` (POST `https://api.elevenlabs.io/v1/text-to-speech/<voiceId>/with-timestamps?output_format=mp3_44100_128`, JSON `{ text, model_id: "eleven_multilingual_v2" }`, the header `xi-api-key`; the audio is written from base64; `durationMs` from `probe`; cost `text.length / 1000 * ELEVENLABS_TTS_USD_PER_1K_CHARS`).

- [ ] **Step 1: Failing test.**

```ts
test("wordsFromAlignment groups characters into words", () => {
  const words = wordsFromAlignment({ characters: ["H", "i", " ", "a", "l", "l"], character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5], character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] });
  expect(words).toEqual([{ text: "Hi", startMs: 0, endMs: 200 }, { text: "all", startMs: 300, endMs: 600 }]);
});
```

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/worker/steps/voice`. Expected: FAIL.

- [ ] **Step 3: Implement** per Interfaces.

- [ ] **Step 4: Run the tests.** Run: `pnpm test src/worker/steps/voice && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(worker): elevenlabs voice with word timings"
```

---

### Task 14: Run, manifest and the spike command

**Files:**
- Create: `src/worker/manifest.ts`, `src/worker/manifest.test.ts`, `src/worker/run.ts`, `src/cli/spike.ts`
- Modify: `package.json` (script `spike` = `tsx src/cli/spike.ts`), `docs/pipeline.md` (a section "Spike run": the run folder and the files)

**Interfaces:**
- Consumes: everything from Tasks 5–13.
- Produces in `manifest.ts`: `RunOptionsSchema` and the type `RunOptions` (fields below), `StepName = "ingest" | "transcribe" | "see" | "direct" | "voice" | "build" | "qa" | "render"`; `ManifestSchema` `{ id: string; createdAt: string; options: RunOptions; steps: Record<StepName, { status: "pending" | "done" | "failed" | "skipped"; ms?: number; error?: string }>; events: UsageEvent[] }`; `loadOrCreateManifest(runDir, options): Manifest`; `saveManifest(runDir, manifest): void`; `shouldRun(manifest, step, resume: boolean): boolean` (with `resume` it skips `done`).
- `RunOptions = { source?: string; text?: string; url?: string; destination: DestinationId; runDir: string; transcriber: "elevenlabs" | "deepgram"; directorModel: string; visionModel: string; voice: boolean; voiceId: string; render: "local" | "lambda" | "none"; resume: boolean }`.
- Produces in `run.ts`: `defaultBrand: VideoDoc["brand"] = { colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"], font: "Onest" }`; `runPipeline(options: RunOptions, env: Env): Promise<{ manifest: Manifest; planPath: string; docPath: string; outputPath?: string }>`: the steps in order, each writes an artifact (`ingest.json`, `transcript.json`, `content.json`, `plan.json`, `voice/*.mp3`, `video.json`, `qa.json`, `out.mp4`, `poster.jpg`, `metrics.json`) and updates the manifest; in text mode `ingest`, `transcribe`, `see` get `skipped`; `transcribe` and `see` run through `Promise.all`; `voice` runs only in text mode when `options.voice && plan.voiceover`, otherwise `skipped`; in footage mode the music is taken through `pickMusic(manifest, plan.musicMood)`; after `direct` the questions are printed to the console with their defaults and the run continues with the defaults; when `qa.ok === false` the `render` step gets `failed` with the error text and the run ends with exit code 2; `metrics.json` is `Metrics.toJSON()` plus `byStep()` and `total()`.
- Produces in `spike.ts`: argument parsing through `node:util` `parseArgs`: a positional path to a video or `--text`, `--url`, `--to` (default `reels`), `--transcriber` (default `elevenlabs`), `--director-model`, `--vision-model`, `--voice` (boolean), `--voice-id` (default `21m00Tcm4TlvDq8ikWAM`), `--render` (default `local`), `--resume` (boolean), `--run` (the id of an existing run); `process.loadEnvFile(".env")` if the file exists; `runDir = runs/<id>` where id = `<yyyymmdd-hhmm>-<slug of the input>`; at the end it prints the `byStep()` table and the total.

- [ ] **Step 1: Failing test** `manifest.test.ts`: `shouldRun` returns `false` for `done` with `resume: true` and `true` without resume; `loadOrCreateManifest` creates a file with eight steps in `pending`.

- [ ] **Step 2: Run the tests, make sure they fail.** Run: `pnpm test src/worker/manifest`. Expected: FAIL.

- [ ] **Step 3: Implement** `manifest.ts`, `run.ts`, `spike.ts` per Interfaces.

- [ ] **Step 4: Run the tests.** Run: `pnpm test && pnpm typecheck && pnpm check`. Expected: PASS.

- [ ] **Step 5: Dry run of text mode without the network.** Run: `pnpm spike --text "Reports now export to PDF" --to reels --render none` with an empty `ANTHROPIC_API_KEY`. Expected: a clear error `Set ANTHROPIC_API_KEY in .env` before the first model call.

- [ ] **Step 6: First real run.** Fill `.env` with the Anthropic keys. Run: `pnpm spike --text "Announce a new feature: reports now export to PDF. Upbeat." --to reels`. Expected: `runs/<id>/out.mp4` plays, `metrics.json` contains the steps `direct`, `build`, `qa`, `render` with milliseconds and dollars.

- [ ] **Step 7: Commit.**

```bash
git add -A && git commit -m "feat(worker): resumable pipeline run and spike command"
```

---

### Task 15: Render on Lambda

**Files:**
- Create: `src/video/render/renderLambda.ts`, `docs/runbooks/lambda.md`
- Modify: `src/worker/run.ts` (the `render: "lambda"` branch), `.env.example`

**Interfaces:**
- Consumes: `VideoDoc`, `Env`, `Metrics`.
- Produces in `renderLambda.ts`: `renderOnLambda(input: { doc: VideoDoc; outName: string; env: Env; metrics: Metrics }): Promise<{ url: string; ms: number; usd: number }>`: `renderMediaOnLambda({ region: env.AWS_REGION, functionName: requireEnv(env, "REMOTION_LAMBDA_FUNCTION_NAME"), serveUrl: requireEnv(env, "REMOTION_SERVE_URL"), composition: "saymo", inputProps: { doc }, codec: "h264", outName, privacy: "public" })` from `@remotion/lambda/client`, then polling `getRenderProgress({ renderId, bucketName, functionName, region })` every 1000 ms until `done`; on `fatalErrorEncountered` it throws an `Error` with `errors`; `usd` from `costs.accruedSoFar`, `url` from `outputFile`.

- [ ] **Step 1: Runbook** `docs/runbooks/lambda.md` following the steps from the Remotion documentation: `npx remotion lambda policies role` → the policy `remotion-lambda-policy` → the role `remotion-lambda-role`; an IAM user, `npx remotion lambda policies user` as an inline policy plus the action `rekognition:DetectFaces`; the keys in `.env` as `REMOTION_AWS_ACCESS_KEY_ID` and `REMOTION_AWS_SECRET_ACCESS_KEY` (and the same values in `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` for Rekognition); `npx remotion lambda policies validate`; `npx remotion lambda functions deploy --memory=2048 --timeout=120`; `npx remotion lambda sites create src/video/remotion/index.ts --site-name=saymo` → `REMOTION_SERVE_URL`; `npx remotion lambda quotas`.

- [ ] **Step 2: Implement** `renderLambda.ts` and the branch in `run.ts`.

- [ ] **Step 3: Follow the runbook** on the owner's account (do not commit the keys). Run: `npx remotion lambda render $REMOTION_SERVE_URL saymo --props=fixtures/video.sample.json`. Expected: a link to the MP4 in S3, the file plays.

- [ ] **Step 4: Run through the pipeline.** Run: `pnpm spike --run <id from Task 14> --resume --render lambda`. Expected: `metrics.json` contains a `render` step with `provider: "lambda"`, `ms` and `usd`.

- [ ] **Step 5: Run the checks.** Run: `pnpm typecheck && pnpm check`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(video): render on remotion lambda with cost tracking"
```

---

### Task 16: Spike runs and decisions

**Files:**
- Modify: `docs/spike-results.md`, `docs/product/decisions.md`, `docs/learnings.md`

- [ ] **Step 1: Sources.** Put three of the owner's files in `runs/inputs/` (not in git): an interview with a face (2–5 minutes, 16:9), a screen recording with voice (1–3 minutes), vertical phone footage (1–2 minutes). Two texts: a feature launch and a sale.

- [ ] **Step 2: Runs.** For each source: `pnpm spike <file> --to reels --transcriber elevenlabs`, then `--resume --transcriber deepgram` into a new run (without `--resume`, to compare the transcription). Texts: `pnpm spike --text "..." --to reels --voice` and `pnpm spike --text "..." --to linkedin`. Repeat one director run with `--director-model claude-sonnet-5-5`, one with `--vision-model claude-sonnet-5-5` and one with `--vision-model claude-haiku-5-5`.

- [ ] **Step 3: Table.** Fill `docs/spike-results.md` with rows from `metrics.json` and eyeball scores. For each run, record whether the director asked questions and which ones.

- [ ] **Step 4: Decisions.** Through the `decision` skill, record: the transcription provider, detection (Rekognition stays, or a plan to move to ONNX), the models for the director and vision, the vision budget cap per run, whether a critic is needed right now. Through `learn`, record what broke and how to fix it.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "docs: spike results and decisions on providers and models"
```

---

## Self-check against the spec

- Sections 5 and 6 (schema, vocabulary): Tasks 4, 9, 10. Stage 0 primitives: background, footage, camera, headline, chip, big number, lower third, captions in three styles, music with ducking, voice. The rest of the vocabulary (transitions other than cut, Lottie, marker and other accents, camera pan over an image) is in stage 1.
- Section 7 (pipeline): Tasks 5–9, 13, 14. The director's questions are printed and accepted at their defaults, the questions screen is in stage 2.
- Section 10 (stack): Tasks 1, 3, 9, 15.
- Section 11 (code rules): Task 2, Global Constraints.
- Section 13 (stage 0, "done when"): the documentation site and the user flow diagram in Task 3, three pieces of footage and two texts in Task 16, the table and the decisions there too.
- Section 16 (skills, documentation): Tasks 2, 3.
- Review Focus: item 1 in Tasks 8 and 9, item 2 in Task 9, item 3 in Tasks 9 and 10, item 4 in Task 7, item 5 in Task 11, item 6 in Task 5.

---

### Task 17: Translate every project file to English

Decision of 2026-10-28: all project files are written in English (docs, CLAUDE.md, skills, comments, commit messages); only the chat with the owner is in Russian. This task translates what was written in Russian before the decision. It runs right after Task 3, before Task 4, so that later tasks produce English docs from the start.

**Files:**
- Modify (translate in place): `CLAUDE.md`, `.claude/skills/*/SKILL.md`, `docs/README.md`, `docs/user-flow.md`, `docs/learnings.md`, `docs/product/*.md` (including `decisions.md`), `docs/design/README.md`, `docs/design/foundations.md`, `docs/design/components.md`, `docs/design/screens.md`, `docs/superpowers/specs/2026-10-28-saymo-v1-design.md`, this plan.
- Not touched: `docs/design/tokens.css`, `tokens.json`, `screens/html/**`, `screens/png/**` (already English or binary).

**Rules for the translation:**
- Translate meaning faithfully; do not summarize, shorten or "improve". Keep every heading level, list, table row and column; keep the document order.
- Code blocks, inline code, identifiers, commands, file paths, numbers, dates, hex values, URLs and UI strings in English stay byte-identical. Russian text inside code blocks (for example test names or prompt wording such as `"no speech"`) stays as it is.
- Mermaid labels are translated; node ids are not.
- The glossary in `CLAUDE.md` and in `docs/product/00-handoff-readme.md` becomes three columns: Term, Meaning, In the UI; the term column is English (video, edit, element, scene, beat, brand, example, editor, format, destination, register, limit, review link).
- House style: no em dashes in prose, sentence case headings, short sentences.
- `CLAUDE.md` gets one more rule under "How to work with me": "Everything in this repository is in English: docs, comments, commit messages, skills. Talk to the owner in Russian."

**Verification:**
- A script run by the implementer compares all fenced code blocks and inline code spans of each file before and after; any difference is a defect. Paste the script's output (per file: N blocks, N spans, 0 differences) into the report.
- `pnpm docs:build` passes.
- `grep -rlP '[А-Яа-яЁё]' CLAUDE.md .claude docs --include=*.md` lists nothing except Russian strings inside code blocks the rule above allows; list each remaining hit with its reason in the report.

**Batches:** (a) `CLAUDE.md`, skills, `docs/README.md`, `docs/user-flow.md`, `docs/learnings.md`, `docs/product/*.md`; (b) `docs/design/*.md`; (c) the spec; (d) this plan. One implementer per batch, sequentially; each batch is one commit `docs: translate <batch> to English`.
