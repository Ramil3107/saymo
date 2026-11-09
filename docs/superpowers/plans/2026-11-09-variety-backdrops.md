# Backdrops and the Camera over Them Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** step 3 of the variety plan: a video names one of ten backdrops in the plan, drawn in its palette, and on beats without footage the camera moves the backdrop behind still text and fields.

**Architecture:** a backdrop is data (`src/video/backdrops.ts`): a name, a summary for the director and a ground, the field tone that text on it reads as (`accent` for `color`, `ink` for `night`, none for the paper ones). Each style lists its backdrops, the first being today's look. The build writes the resolved backdrop into the document, swaps field tones that would vanish on the ground and sets `on` to the ground for text on the bare backdrop, so the existing field colors keep everything readable. The renderer draws the backdrop by id on video time, inside a camera that moves only the backdrop layer.

**Tech Stack:** TypeScript, Zod, React on Remotion 4, Vitest, Biome.

**Spec:** "Variety across videos", step 3, in `docs/vocabulary.md`; the set the owner approved on 2026-11-09: `bold-pop` glow, color, night, halftone, pills, streak; `clean-paper` paper-grid, studio, dots, sketchbook, night; the camera moves the backdrop, text and color fields stay still.

## Global Constraints

- The code rules and style of `CLAUDE.md`: no `as`, no `!`, no `any`; Zod schemas end in `Schema`; functions up to about 30 lines; a `switch` over a union has no `default`; magic numbers are named constants; tests in `tests/` next to the module.
- Positions are whole pixels and a resting element has no transform (`wholePx`, `restingTransform` in `src/video/remotion/motion/pixels.ts`).
- Older plans and documents render unchanged: no backdrop means the style's first one (`glow`, `paper-grid`).
- Documentation goes in the same commit as the change; `pnpm check`, `pnpm typecheck`, `pnpm test` green before every commit.
- Renders are local (`pnpm render:plan`), no paid API.

## Review Focus

- A plan moved to another style with `--style` names a backdrop the new style lacks: the style's first backdrop applies (Task 1 test).
- A brand with a light accent (lime, yellow) on `color`: the text on the ground is ink, not white (Task 2 test).
- A marked title line on `night`: the marker is a color the text reads on, never the text's own color (Task 2 test).
- A pan at full intensity in 16:9 and 1:1: the backdrop's edge never shows (Task 4 test).
- A beat whose whole frame is a field (the dark forms of `fill`, `bands`, `echo`) on `night`: the frame field is not the ground's tone, so the beat still turns (Task 2 test).

---

## Changed while building

- The geometry helpers are `pillRows.ts` and `halftoneDots.ts`: `pills.ts` beside `Pills.tsx` differs only in case, which macOS does not tell apart.
- A pan grows the backdrop just enough to hide its edge instead of drawing it past the frame (`backdropOverscan` is gone): every look keeps drawing in the frame, and `sketchbook`'s ruled frame stays in view on still beats.
- The kit test lives in `src/video/remotion/style/tests/kit.test.ts`, the module it tests.
- `pnpm check:still` cannot judge a field beside a moving backdrop: the encoder adds noise at the text's edges. Lossless stills of neighbouring frames are identical there.
- The ads showed a marker under an accent line that did not read on it; `fieldColors` now picks a marker both the ink and the accent text read on.

### Task 1: Backdrops as data

**Files:**
- Create: `src/video/backdrops.ts`
- Modify: `src/video/styles.ts`, `src/video/schema/plan.ts`, `src/video/schema/video.ts`
- Test: `src/video/tests/backdrops.test.ts`, `src/video/schema/tests/plan.test.ts`

**Interfaces:**
- Produces: `BackdropIdSchema` (enum `glow`, `paper-grid`, `color`, `night`, `halftone`, `pills`, `streak`, `studio`, `dots`, `sketchbook`), `type BackdropId`, `type Ground = Extract<FieldTone, "accent" | "ink">`, `type Backdrop = { name: string; summary: string; ground?: Ground }`, `backdrops: Record<BackdropId, Backdrop>`; `Style.backdrops: BackdropId[]`; `styleBackdrop(style: StyleId, requested?: BackdropId): BackdropId` in `styles.ts`; optional `backdrop` on the plan and on the document.

- [ ] **Step 1: Write the failing tests**: `every style lists known backdrops, its first being today's look` (bold-pop starts with `glow`, clean-paper with `paper-grid`, no duplicates); `every backdrop is listed by a style`; `only color and night have a ground` (`color` → `accent`, `night` → `ink`); `styleBackdrop keeps a listed backdrop and falls back to the style's first` (`("clean-paper", "night")` → `night`, `("bold-pop", "sketchbook")` → `glow`, `("bold-pop")` → `glow`); in `plan.test.ts`, `a plan names a backdrop` parses with `backdrop: "dots"` and fails with `backdrop: "lava"`.
- [ ] **Step 2: Run** `pnpm test src/video/tests/backdrops.test.ts src/video/schema/tests/plan.test.ts`; expected FAIL, module not found.
- [ ] **Step 3: Implement**: the ten backdrops with one-line summaries for the director (look, reference, what it suits); `bold-pop.backdrops = ["glow", "color", "night", "halftone", "pills", "streak"]`, `clean-paper.backdrops = ["paper-grid", "studio", "dots", "sketchbook", "night"]`; `textures` stays until Task 3.
- [ ] **Step 4: Run** the same tests; expected PASS; then `pnpm typecheck`.

### Task 2: Text and fields that read on the ground

**Files:**
- Create: `src/video/layout/ground.ts`
- Modify: `src/worker/steps/build/buildVideo.ts`, `src/video/remotion/style/kit.ts`, `src/video/remotion/SaymoVideo.tsx`
- Test: `src/video/layout/tests/ground.test.ts`, `src/worker/steps/build/tests/buildVideo.test.ts`, `src/video/remotion/tests/theme.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `toneOnGround(tone: FieldTone, ground: Ground | undefined): FieldTone`; the document's `backdrop` is always the resolved id; `styleKit(id: StyleId, brand: Brand, backdrop?: BackdropId)` adds `kit.backdrop: BackdropId` and `kit.ground?: Ground`, and a dip transition on a ground dips into the ground's color.

- [ ] **Step 1: Write the failing tests**: `toneOnGround swaps only the tones that would vanish` (`("accent", "accent")` → `ink`, `("ink", "ink")` → `accent`, `("alt", "ink")` → `highlight`, `("highlight", "accent")` → `highlight`, any tone with no ground unchanged, and for every tone and ground the result is not the ground); build: `the document carries the style's backdrop` (no backdrop in the plan → `glow` for bold-pop; `pills` under clean-paper → `paper-grid`); `on a color backdrop no field is accent and bare text reads on the accent` (a split beat's field is `ink`, a center beat's title has `on: "accent"`, a chip keeps no `on`); `on a night backdrop the dark frame forms turn color` (a second `bands` beat: no field and no `lineOn` is `ink`); theme: `a light brand accent on color takes ink text` (`fieldColors` of a `#C8FF2E` brand on `accent` gives ink); `a marked line on night is swept in a color it reads on`; `styleKit without a backdrop draws the style's first` and `dips into the ground's color on night`.
- [ ] **Step 2: Run** `pnpm test src/video/layout/tests/ground.test.ts src/worker/steps/build/tests/buildVideo.test.ts src/video/remotion/tests/theme.test.ts`; expected FAIL.
- [ ] **Step 3: Implement**: the build resolves `styleBackdrop(style, plan.backdrop)`, maps every field tone, `on` and `lineOn` of a backdrop beat through `toneOnGround`, and gives text that is not a label and sits on no field `on: ground`; `SaymoVideo` passes `doc.backdrop` to `styleKit`.
- [ ] **Step 4: Run** the tests; expected PASS; `pnpm typecheck`.
- [ ] **Step 5: Commit** Tasks 1 and 2 with the "Backdrops" section of `docs/vocabulary.md`, the schema page and the decision: `feat: a video names its backdrop, and text and fields read on a colored or dark one`.

### Task 3: Draw the backdrops

**Files:**
- Create: `src/video/remotion/backdrop/Backdrop.tsx` and one file per new look in the same folder: `ColorWash.tsx`, `Night.tsx`, `Pills.tsx`, `Streak.tsx`, `Studio.tsx`, `DotGrid.tsx`, `Sketchbook.tsx`
- Modify: `src/video/remotion/primitives/Background.tsx`, `src/video/remotion/accents/Blobs.tsx` (optional `ms`), `src/video/styles.ts` (drop `textures`, `Texture`), labs that drew `style/Textures.tsx`
- Delete: `src/video/remotion/style/Textures.tsx`
- Test: `src/video/remotion/backdrop/tests/pills.test.ts`

**Interfaces:**
- Consumes: `kit.backdrop`, `kit.palette`.
- Produces: `Backdrop({ kit, frame, ms }: { kit: StyleKit; frame: Frame; ms: number })`, where `ms` is video time, so a backdrop flows across cuts; `pillRows(frame: Frame, ms: number): PillRow[]` in `Pills.tsx`'s geometry helper `pills.ts`.

- [ ] **Step 1: Write the failing test** `pill rows cover the frame in every format` (for 9:16, 1:1, 16:9 and three times, the rows' union covers the overscanned frame and no row is empty).
- [ ] **Step 2: Run** `pnpm test src/video/remotion/backdrop/tests/pills.test.ts`; expected FAIL.
- [ ] **Step 3: Implement** the looks: `color` the frame in the accent with a lighter spot that drifts and grain (Higgsfield's Playable cards); `night` a near-black tinted by the second tone, a soft accent glow and grain (Content Factory, Floating Dark UI); `halftone` accent dots sweeping in from a corner (Higgsfield's portraits); `pills` diagonal rows of rounded pills in light tints of the palette sliding in alternate directions (motionvid's Sticker Launch); `streak` a long blurred accent streak with a thinner highlight one drifting across paper (Higgsfield's "What if"); `studio` a cool light grey with light from above, a trace of the accent; `dots` a fine dot grid with a soft vignette (a design canvas); `sketchbook` cream paper, a thin ruled frame and corner ticks (motionvid's Sketchbook). `Background` draws `Backdrop` with `ms = scene.startMs + local ms`.
- [ ] **Step 4: Run** the test, `pnpm typecheck`, then render `fixtures/plan.backdrops.json` (Task 5) or a quick still per backdrop and look at each frame for legibility of ink text on it.
- [ ] **Step 5: Commit** with the docs: `feat: eight new backdrops drawn in the palette`.

### Task 4: The camera over the backdrop

**Files:**
- Modify: `src/video/motion/camera.ts`, `src/video/remotion/primitives/Background.tsx`, `src/video/remotion/SaymoVideo.tsx`
- Test: `src/video/motion/tests/camera.test.ts`

**Interfaces:**
- Produces: `type BackdropView = { scale: number; x: number; y: number }` (x, y as shares of the frame) and `backdropView(camera: Camera | undefined, ms: number, durationMs: number, tempo: Tempo): BackdropView`; `backdropOverscan`, the share the backdrop is drawn beyond each edge.

- [ ] **Step 1: Write the failing tests**: `no camera leaves the backdrop at rest` (identity); `push grows the backdrop over the beat` (monotonic, ends at `1 + backdropPushZoom * intensity`); `pan slides it without showing an edge` (for every format, intensity 0.5 and 1 and every tenth of the beat, `scale * (0.5 + backdropOverscan) >= 0.5 + |x|` and the same for y); `punch-in snaps in on the tempo and never comes to rest` (scale at 0 ms is the punch zoom, settled within the tempo's move, and differs between any two consecutive frames afterwards).
- [ ] **Step 2: Run** `pnpm test src/video/motion/tests/camera.test.ts`; expected FAIL.
- [ ] **Step 3: Implement**; the backdrop layer of a scene without footage is drawn with the overscan and transformed by `backdropView`; fields and elements are not.
- [ ] **Step 4: Run** the tests; render the lab and run `pnpm check:still` over a crop inside a field during a push: it must pass.
- [ ] **Step 5: Commit** with the docs: `feat: the camera moves the backdrop on beats without footage`.

### Task 5: The director, the render flag and the lab

**Files:**
- Modify: `src/worker/steps/direct/prompts.ts`, `src/cli/renderPlan.ts`
- Create: `fixtures/plan.backdrops.json`
- Test: `src/worker/steps/direct/tests/prompts.test.ts`

**Interfaces:**
- Produces: a "Backdrops" table and each style's backdrop list in the system prompt, a rule for `backdrop` and for moving the camera on beats without footage; `pnpm render:plan <plan> --out <dir> [--backdrop <id>]`.

- [ ] **Step 1: Write the failing test** `the system prompt lists every backdrop and each style's own`.
- [ ] **Step 2: Run** `pnpm test src/worker/steps/direct/tests/prompts.test.ts`; expected FAIL.
- [ ] **Step 3: Implement** the prompt lines and the flag; the fixture is four beats (center with a push, split with a pan, giant-number with a punch-in, bands with a push).
- [ ] **Step 4: Run** the test; render the fixture once per backdrop of each style into `runs/backdrop-lab/<style>/<backdrop>/` and tile one frame per beat into `runs/backdrop-lab/sheet.jpg`; replan the four text-only ads in `runs/variety-text/` with a backdrop each and camera moves (step 2 renders kept in `runs/variety-text/step2/`), with `contact-sheet-step3.jpg` and `before-after-step3.jpg`.
- [ ] **Step 5: Commit** with the docs and the handoff: `feat: the director names a backdrop and moves the camera over it`.
