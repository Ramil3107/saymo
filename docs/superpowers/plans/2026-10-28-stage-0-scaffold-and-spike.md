# Этап 0: каркас и спайк. План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Репозиторий с правилами, скиллами и сайтом документации, плюс команда `pnpm spike`, которая из видео или текста делает план, документ ролика и MP4 (локально и один раз через Lambda) и пишет таблицу времени и стоимости по шагам.

**Architecture:** Один TypeScript-пакет. `src/video/` знает про ролик (схема, регистры, примитивы Remotion, QA, рендер) и не знает про внешние сервисы. `src/worker/steps/` это шаги конвейера (ingest, transcribe, see, direct, voice, build), каждый пишет артефакт в папку прогона. `src/worker/run.ts` ведёт шаги по манифесту и перезапускается с места падения. `src/cli/spike.ts` это тонкая обёртка над `runPipeline`. Next.js, база и очередь в этом этапе не появляются.

**Tech Stack:** Node 22, pnpm, TypeScript strict, Biome, Vitest, tsx, Zod, Remotion 4.x (`remotion`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/media`, `@remotion/captions`, `@remotion/google-fonts`, `@remotion/layout-utils`, `@remotion/lambda`), React 19, `@anthropic-ai/sdk`, `@aws-sdk/client-rekognition`, `@deepgram/sdk`, ElevenLabs по REST через `fetch`, ffmpeg и ffprobe системные, VitePress + `vitepress-plugin-mermaid`.

**Spec:** `docs/superpowers/specs/2026-10-28-saymo-v1-design.md` (разделы 5, 6, 7, 10, 11, 13 и 16).

## Global Constraints

- Node 22 (`.nvmrc` = `22`), pnpm через corepack, `.npmrc` с `save-exact=true`. Все пакеты `@remotion/*` и `remotion` одной версии.
- TypeScript strict, без `any`. Biome чистый и Vitest зелёный перед каждым коммитом. ESM (`"type": "module"`), `__dirname` не используется, пути от `import.meta.url` или `process.cwd()`.
- Zod на каждой границе: env, вывод модели, ответы внешних API, файлы прогонов.
- Код читается без комментариев. Комментарий только там, где «почему» не очевидно, одной строкой. Никаких заголовков-разделителей, TODO и мёртвого кода.
- `src/video/` не импортирует из `src/worker/` и `src/lib/ai`. Шаги конвейера не импортируют друг друга, только схемы и `src/lib`.
- Модель Claude по умолчанию `claude-opus-5-5` (`SAYMO_DIRECTOR_MODEL`, `SAYMO_VISION_MODEL` переопределяют для замера; кандидаты для замера `claude-sonnet-5-5` для режиссёра и зрения, `claude-haiku-5-5` для правок). Thinking не задаётся (адаптивный по умолчанию), `output_config.effort` задаётся явно. Серверный fallback включён: `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`. Prefill не используется.
- Каждый вызов модели, расшифровки, озвучки, детекции и рендера пишется в метрики прогона с миллисекундами и долларами.
- Формат кадра: 9:16 = 1080×1920, 1:1 = 1080×1080, 16:9 = 1920×1080, 30 кадров в секунду.
- Документация: каждая задача, которая меняет поведение, обновляет страницу в `docs/` в том же коммите.

## Review Focus

1. Исходник без речи (немой или только музыка): расшифровка пустая, режиссёр всё равно даёт план нарезки без субтитров, сборка не падает. Тест в задаче 8 (`direct` с `transcript.words = []`) и задаче 9 (`buildVideo` без субтитров).
2. Горизонтальный исходник в вертикальный ролик: футаж заполняет кадр без полос, а если есть лицо, кроп сдвигается так, чтобы лицо осталось в кадре. Тест `fitCover` в задаче 9.
3. Русскоязычный исходник: язык определяется, субтитры и заголовки с кириллицей не ломают разбивку на страницы, шрифт грузится с `cyrillic`. Тесты в задаче 9 (кириллица в словах) и задаче 10 (subsets).
4. Исходник на 10 минут: из 300 ключевых кадров на описание уходят не больше 60 (по одному на план плюс равномерно), пачками по 20, стоимость считается до вызова и прогон останавливается, если оценка выше порога. Тесты `selectFramesForDescription`, `batch` и `estimateVisionUsd` в задаче 7.
5. План длиннее потолка назначения или длиннее исходника: QA даёт ошибку, прогон помечается `qa-failed`, а не рендерит. Тест `planWithinLimits` в задаче 11.
6. Файл не видео, или ffmpeg не найден: `probe` бросает `IngestError` с понятным текстом до любых платных вызовов. Тест в задаче 5.

---

## Файлы этапа

```
.nvmrc .npmrc package.json tsconfig.json biome.json vitest.config.ts .env.example
CLAUDE.md
.claude/skills/{learn,decision,docs,review,vocab,spike}/SKILL.md
docs/.vitepress/config.ts  docs/index.md  docs/overview.md  docs/architecture.md  docs/pipeline.md
docs/video-schema.md  docs/vocabulary.md  docs/learnings.md  docs/runbooks/setup.md  docs/runbooks/lambda.md
docs/spike-results.md  (docs/user-flow.md и docs/product/decisions.md уже есть)
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

Тесты лежат рядом с кодом: `foo.ts` → `foo.test.ts`.

---

### Task 1: Каркас пакета и окружение

**Files:**
- Create: `.nvmrc`, `.npmrc`, `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.env.example`, `src/lib/env.ts`, `src/lib/env.test.ts`
- Modify: `.gitignore` (добавить `runs/`, `.remotion/`, `docs/.vitepress/cache/`, `docs/.vitepress/dist/`)

**Interfaces:**
- Produces: `loadEnv(source: Record<string, string | undefined> = process.env): Env` в `src/lib/env.ts`, `Env` это вывод Zod-схемы: `ANTHROPIC_API_KEY?`, `ELEVENLABS_API_KEY?`, `DEEPGRAM_API_KEY?`, `AWS_REGION` (default `"us-east-1"`), `AWS_ACCESS_KEY_ID?`, `AWS_SECRET_ACCESS_KEY?`, `REMOTION_AWS_ACCESS_KEY_ID?`, `REMOTION_AWS_SECRET_ACCESS_KEY?`, `REMOTION_LAMBDA_FUNCTION_NAME?`, `REMOTION_SERVE_URL?`, `SAYMO_DIRECTOR_MODEL` (default `"claude-opus-5-5"`), `SAYMO_VISION_MODEL` (default `"claude-opus-5-5"`), `SAYMO_VISION_BUDGET_USD` (число, default `1`). Пустые строки трактуются как отсутствие.
- Produces: `requireEnv(env: Env, key: keyof Env): string` бросает `Error("Set <KEY> in .env")`.

- [ ] **Step 1: Окружение.** Выполнить `nvm install 22 && nvm use 22` (если nvm нет, поставить Node 22 с nodejs.org), `corepack enable && corepack prepare pnpm@latest --activate`. Проверить: `node -v` печатает `v22.`, `pnpm -v` печатает версию.

- [ ] **Step 2: Файлы конфигурации.** `.nvmrc` = `22`. `.npmrc` = `save-exact=true` и `auto-install-peers=true`. `package.json`: `"name": "saymo"`, `"private": true`, `"type": "module"`, `"engines": {"node": ">=22"}`, скрипты `check` = `biome check .`, `format` = `biome check --write .`, `typecheck` = `tsc --noEmit`, `test` = `vitest run`, `test:watch` = `vitest`. `tsconfig.json`: `target ES2022`, `module ESNext`, `moduleResolution Bundler`, `jsx react-jsx`, `strict true`, `noUncheckedIndexedAccess true`, `verbatimModuleSyntax true`, `skipLibCheck true`, `include ["src", "docs/.vitepress"]`. `biome.json`: `recommended` правила, форматтер с двумя пробелами и двойными кавычками, `organizeImports` включён. `vitest.config.ts`: `include: ["src/**/*.test.ts"]`, `environment: "node"`. `.env.example`: все ключи из Interfaces с пустыми значениями и значениями по умолчанию.

- [ ] **Step 3: Установить зависимости.** `pnpm add zod` и `pnpm add -D typescript @biomejs/biome vitest tsx @types/node`. Выполнить `pnpm biome init` только если `biome.json` ещё не создан вручную.

- [ ] **Step 4: Написать падающий тест** `src/lib/env.test.ts`:

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

- [ ] **Step 5: Прогнать тест, убедиться, что падает.** Run: `pnpm test -- src/lib/env.test.ts`. Expected: FAIL, модуль не найден.

- [ ] **Step 6: Реализовать `loadEnv` и `requireEnv`** в `src/lib/env.ts` на Zod с `z.preprocess` для пустых строк. Загрузка `.env` в процесс делается в точках входа через `process.loadEnvFile(".env")` (Node 22), в `loadEnv` нет.

- [ ] **Step 7: Прогнать тест, typecheck и Biome.** Run: `pnpm test && pnpm typecheck && pnpm check`. Expected: всё зелёное.

- [ ] **Step 8: Commit.**

```bash
git add -A && git commit -m "chore: package scaffold with typescript, biome, vitest and validated env"
```

---

### Task 2: CLAUDE.md и скиллы

**Files:**
- Create: `CLAUDE.md`, `.claude/skills/learn/SKILL.md`, `.claude/skills/decision/SKILL.md`, `.claude/skills/docs/SKILL.md`, `.claude/skills/review/SKILL.md`, `.claude/skills/vocab/SKILL.md`, `.claude/skills/spike/SKILL.md`, `docs/learnings.md`
- Modify: `docs/product/00-handoff-readme.md` (первой строкой: «Правила работы переехали в `CLAUDE.md`, здесь остался словарь терминов»).

**Interfaces:** нет кода.

- [ ] **Step 1: Написать `CLAUDE.md`** с разделами в этом порядке: «Что это» (три строки о продукте и ссылка на спеку), «Как со мной работать» (по-русски; интерфейс продукта на английском; технологии и архитектуру не менять без записи в `docs/product/decisions.md`; при расхождении документов показать и спросить; заглушки в квадратных скобках это нерешённые вопросы), «Правила кода» (девять пунктов раздела 11 спеки, дословно), «Структура» (дерево из раздела 9 спеки с одной строкой на папку), «Команды» (`pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm spike`, `pnpm docs:dev`, `pnpm remotion:studio`), «Скиллы» (таблица шести скиллов: имя и когда вызывать), «Определение готовности» (Biome, typecheck, тесты, документация обновлена, решение записано, если принималось), «Словарь» (таблица терминов из хендоффа: ролик, правка, элемент, сцена, бит, бренд, назначение, регистр, лимит, ссылка на согласование).

- [ ] **Step 2: Написать шесть `SKILL.md`.** У каждого frontmatter `name` и `description` (одна строка, когда вызывать), дальше шаги. Содержание:
  - `learn`: спросить, что произошло, если не сказано; добавить в `docs/learnings.md` запись `### <дата> · <заголовок>` с полями «Что случилось», «Урок», «Правило» (куда предложить: `CLAUDE.md` или конкретный скилл); показать diff правила и применить после подтверждения; закоммитить `docs: learning <заголовок>`.
  - `decision`: собрать дату, «что решили», «почему», «что отвергли»; вставить запись сверху `docs/product/decisions.md` под строкой `---`; закоммитить `docs: decision <заголовок>`.
  - `docs`: по диффу текущей ветки найти затронутые области (`src/video` → `docs/video-schema.md` и `docs/vocabulary.md`, `src/worker` → `docs/pipeline.md`, `src/lib` → `docs/architecture.md`, потоки пользователя → `docs/user-flow.md`); обновить страницы; прогнать `pnpm docs:build`; закоммитить с префиксом `docs:`.
  - `review`: прогнать `pnpm check && pnpm typecheck && pnpm test`; пройти по диффу чек-лист из «Правил кода» (читаемость, срезы не лезут друг в друга, Zod на границах, нет лишних запросов и тяжёлых импортов, тесты на логику, строки через локализацию, стили через токены, нет комментариев от ИИ); вывести список замечаний с файлом и строкой, без исправлений.
  - `vocab`: спросить имя и параметры примитива; создать `src/video/remotion/primitives/<Name>.tsx`, добавить Zod-схему параметров в `src/video/schema/video.ts`, карточку в каталог (когда появится, этап 1) и тест на регистры и форматы; прогнать рендер одного кадра `pnpm remotion:still`.
  - `spike`: `pnpm spike <путь или --text> --to <назначение> [--transcriber elevenlabs|deepgram] [--render local|lambda|none]`; после прогона дописать строку в таблицу `docs/spike-results.md` из `runs/<id>/metrics.json`.

- [ ] **Step 3: Создать `docs/learnings.md`** с заголовком и одной строкой «Записи добавляет скилл `learn`, новые сверху».

- [ ] **Step 4: Проверить frontmatter.** Run: `for f in .claude/skills/*/SKILL.md; do head -4 "$f"; done`. Expected: у каждого файла `---`, `name:`, `description:`.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "docs: CLAUDE.md with code rules and six project skills"
```

---

### Task 3: Сайт документации

**Files:**
- Create: `docs/.vitepress/config.ts`, `docs/index.md`, `docs/overview.md`, `docs/architecture.md`, `docs/pipeline.md`, `docs/video-schema.md`, `docs/vocabulary.md`, `docs/runbooks/setup.md`, `docs/runbooks/lambda.md` (заглушка в одну строку «Заполняется в задаче 15»), `docs/spike-results.md`
- Modify: `package.json` (скрипты `docs:dev` = `vitepress dev docs`, `docs:build` = `vitepress build docs`, `docs:preview` = `vitepress preview docs`), `docs/README.md` (добавить строку про сайт и команду).

**Interfaces:** нет кода.

- [ ] **Step 1: Установить.** `pnpm add -D vitepress vitepress-plugin-mermaid mermaid`.

- [ ] **Step 2: Конфиг.** `docs/.vitepress/config.ts` экспортирует `withMermaid(defineConfig({...}))` с `title: "Saymo"`, `lang: "ru-RU"`, `srcExclude: ["design/screens/html/**"]`. Sidebar: Обзор (`/overview`), Путь пользователя (`/user-flow`), Архитектура (`/architecture`), Конвейер (`/pipeline`), Схема ролика (`/video-schema`), Словарь (`/vocabulary`), Решения (`/product/decisions`), Уроки (`/learnings`), Инструкции (`/runbooks/setup`, `/runbooks/lambda`), Спайк (`/spike-results`), Спека (`/superpowers/specs/2026-10-28-saymo-v1-design`). `ignoreDeadLinks: true` не ставить: битые ссылки должны ломать сборку.

- [ ] **Step 3: Страницы.** Каждая страница 20–60 строк, выжимка из спеки со ссылкой на её раздел, не копия:
  - `index.md`: hero с одной фразой продукта и тремя ссылками (обзор, путь пользователя, спека).
  - `overview.md`: что строим, три режима входа, главный жест, что не входит (разделы 1 и 3 спеки).
  - `architecture.md`: одно приложение и два входа, дерево папок с ответственностью, правила импортов, стек (разделы 9 и 10).
  - `pipeline.md`: состояния задачи, десять шагов с ориентирами времени, mermaid-диаграмма шагов с параллельностью (раздел 7).
  - `video-schema.md`: что в документе ролика, правила схемы, регистры (раздел 5). Обновляется в задаче 4.
  - `vocabulary.md`: категории примитивов, минимум первой версии, откуда брать, правило про каталог (раздел 6).
  - `runbooks/setup.md`: Node 22, pnpm, ffmpeg, `.env` по `.env.example`, какие ключи где взять (Anthropic, ElevenLabs, Deepgram, AWS IAM-пользователь с правами Rekognition и Remotion Lambda).
  - `spike-results.md`: заголовок, описание пяти прогонов (три футажа, два текста) и пустая таблица со столбцами: прогон, вход, назначение, расшифровка (провайдер, с, $), зрение (кадров, с, $), режиссёр (модель, токены, с, $), сборка (с), рендер (где, с, $), итого (с, $), оценка глазами 1–5, заметки.

- [ ] **Step 4: Собрать.** Run: `pnpm docs:build`. Expected: `build complete` без ошибок dead links.

- [ ] **Step 5: Посмотреть глазами.** Run: `pnpm docs:preview`, открыть `/user-flow`: диаграмма отрисована, sidebar полный.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "docs: vitepress site with topic pages and mermaid"
```

---

### Task 4: Схемы: медиа, расшифровка, карта контента, план, документ ролика

**Files:**
- Create: `src/video/schema/media.ts`, `src/video/schema/transcript.ts`, `src/video/schema/content.ts`, `src/video/schema/plan.ts`, `src/video/schema/video.ts`, `src/video/destinations.ts`, `src/video/registers.ts`, `src/video/schema/plan.test.ts`, `src/video/schema/video.test.ts`, `fixtures/plan.footage.json`, `fixtures/plan.text.json`
- Modify: `docs/video-schema.md`

**Interfaces:**
- Produces в `media.ts`: `MediaInfoSchema` и тип `MediaInfo = { durationMs: number; width: number; height: number; fps: number; hasAudio: boolean; sizeBytes: number }`.
- Produces в `transcript.ts`: `TranscriptWordSchema` `{ text: string; startMs: number; endMs: number; speaker?: string }`, `TranscriptSchema` `{ language: string; text: string; words: TranscriptWord[] }`, типы `TranscriptWord`, `Transcript`.
- Produces в `content.ts`: `BoxSchema` `{ x: number; y: number; w: number; h: number }` (доли кадра 0..1), `ShotSchema` `{ index: number; startMs: number; endMs: number }`, `FaceBoxSchema` = Box + `{ tMs: number }`, `FrameNoteSchema` `{ tMs: number; description: string; kind: "face" | "screen" | "other"; onScreenText: string[] }`, `ContentMapSchema` `{ source: { path: string } & MediaInfo; shots: Shot[]; faces: FaceBox[]; frames: FrameNote[]; transcript: Transcript | null }`, типы `Box`, `Shot`, `FaceBox`, `FrameNote`, `ContentMap`.
- Produces в `destinations.ts`: `DestinationIdSchema = z.enum(["reels", "stories", "shorts", "linkedin", "youtube", "file"])`, `FormatSchema = z.enum(["9:16", "1:1", "16:9"])`, `destinations: Record<DestinationId, { format: Format; maxLengthMs: number; safeZone: { top: number; bottom: number; left: number; right: number }; captionsDefault: boolean }>` со значениями: reels 9:16 180000, stories 9:16 60000, shorts 9:16 180000, linkedin 16:9 600000, youtube 16:9 600000, file 9:16 600000; safeZone для reels/stories/shorts `{ top: 0.14, bottom: 0.22, left: 0.04, right: 0.14 }`, для остальных `{ top: 0.05, bottom: 0.05, left: 0.05, right: 0.05 }`; captionsDefault true везде кроме youtube и file. `formatSize(format): { width: number; height: number }` по Global Constraints.
- Produces в `registers.ts`: `RegisterIdSchema = z.enum(["driving-launch", "serious-clinical", "rich-premium", "playful-sale"])`, `registers: Record<RegisterId, RegisterTokens>` где `RegisterTokens = { sceneMs: [number, number]; minHoldMs: number; staggerMs: number; easing: "snap" | "settle" | "drift" | "bounce"; overshoot: number; fontWeight: [number, number]; maxElements: number; maxConcurrentMotions: number; musicBpm: [number, number] }` со значениями из таблицы регистров спеки motion (driving-launch: sceneMs [1500, 2500], minHoldMs 700, staggerMs 40, snap, 1.4, [800, 900], 4, 2, [110, 130]; serious-clinical: [3000, 4500], 1200, 80, settle, 0, [500, 700], 3, 1, [70, 90]; rich-premium: [2500, 4000], 1000, 60, drift, 0.6, [600, 800], 5, 2, [80, 100]; playful-sale: [1500, 2500], 700, 50, bounce, 1.8, [800, 900], 6, 3, [120, 140]).
- Produces в `plan.ts`: `BeatRoleSchema = z.enum(["hook", "setup", "message", "proof", "how", "cta", "sting"])`, `OverlayKindSchema = z.enum(["headline", "chip", "big-number", "lower-third", "quote", "sticker"])`, `CameraSchema` `{ kind: "none" | "push" | "punch-in" | "pan"; intensity: number (0..1) }`, `OverlaySchema` `{ id: string; kind: OverlayKind; text: string; sub?: string; atMs: number; durationMs: number; emphasis?: "marker" | "underline" | "pulse" }`, `BeatSchema` `{ id: string; role: BeatRole; startMs: number; durationMs: number; footage?: { fromMs: number; toMs: number }; camera?: Camera; copy?: { headline?: string; sub?: string }; overlays: Overlay[]; voiceText?: string }`, `QuestionSchema` `{ id: string; text: string; options: string[] (2..4); defaultOption: string }`, `PlanSchema` `{ title: string; summary: string; cast: { name: string; role?: string }[]; destination: DestinationId; lengthMs: number; register: RegisterId; musicMood: string; captions: { enabled: boolean; style: "karaoke" | "box" | "pop" }; voiceover: boolean; beats: Beat[] (min 1); assumptions: string[]; questions: Question[] (max 3) }`, типы `Plan`, `Beat`, `Overlay`, `Question`. Правило `.superRefine`: сумма `durationMs` битов равна `lengthMs` с допуском 200, `defaultOption` входит в `options`, id битов уникальны.
- Produces в `video.ts`: `ElementSchema` как discriminated union по `kind` ∈ `headline | chip | big-number | lower-third | quote | sticker` с общими полями `{ id: string; enterMs: number; exitMs: number; box: Box; emphasis?: "marker" | "underline" | "pulse" }` и своими: `headline { text: string; sub?: string }`, `chip { text: string }`, `big-number { value: string; label?: string }`, `lower-third { name: string; role?: string }`, `quote { text: string; author?: string }`, `sticker { text: string }`. `SceneSchema` `{ id: string; startMs: number; durationMs: number; background: { kind: "brand" | "solid" | "gradient"; color?: string }; footage?: { assetId: string; fromMs: number; transform: { scale: number; x: number; y: number } }; camera?: Camera; elements: Element[]; transition: "cut" | "fade" | "slide" }`. `CaptionPageSchema` `{ text: string; startMs: number; durationMs: number; tokens: { text: string; fromMs: number; toMs: number }[] }`. `VideoDocSchema` `{ id: string; format: Format; fps: 30; durationMs: number; destination: DestinationId; register: RegisterId; brand: { colors: string[] (1..3); font: string; logo?: string }; assets: { id: string; kind: "video" | "audio" | "image"; src: string; durationMs?: number }[]; scenes: Scene[]; captions?: { style: "karaoke" | "box" | "pop"; pages: CaptionPage[] }; music?: { assetId: string; volume: number; duckTo: number; speech: { startMs: number; endMs: number }[] }; voice: { assetId: string; atMs: number }[] }`, типы `VideoDoc`, `Scene`, `Element`, `CaptionPage`. Правило: сцены идут подряд без зазоров и перекрытий, последняя заканчивается на `durationMs`.

- [ ] **Step 1: Написать падающие тесты** `plan.test.ts` и `video.test.ts`:

```ts
test("fixture plans are valid", () => {
  expect(() => PlanSchema.parse(footagePlan)).not.toThrow();
  expect(() => PlanSchema.parse(textPlan)).not.toThrow();
});
test("beats must add up to lengthMs within 200 ms", () => {
  const broken = { ...footagePlan, lengthMs: footagePlan.lengthMs + 1000 };
  expect(PlanSchema.safeParse(broken).success).toBe(false);
});
test("defaultOption must be one of options", () => { /* вопрос с чужим дефолтом не проходит */ });
test("scenes must be contiguous", () => { /* документ со щелью между сценами не проходит */ });
test("formatSize", () => { expect(formatSize("9:16")).toEqual({ width: 1080, height: 1920 }); });
```

- [ ] **Step 2: Фикстуры.** `fixtures/plan.footage.json`: план на 45 000 мс для `reels`, регистр `driving-launch`, пять битов (hook с footage 12000..15000 и overlay headline, setup, message с chip, proof с big-number «3×», cta с sticker), `captions.enabled true`, `voiceover false`, один вопрос с дефолтом. `fixtures/plan.text.json`: план на 15 000 мс без footage, `voiceover true`, у каждого бита `voiceText`, `questions []`.

- [ ] **Step 3: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/video/schema`. Expected: FAIL.

- [ ] **Step 4: Реализовать схемы** по Interfaces. Для `fps` использовать `z.literal(30)`.

- [ ] **Step 5: Прогнать.** Run: `pnpm test -- src/video/schema && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Обновить `docs/video-schema.md`**: таблица полей `VideoDoc`, список типов элементов, таблица назначений, таблица регистров.

- [ ] **Step 7: Commit.**

```bash
git add -A && git commit -m "feat(video): zod schemas for media, transcript, content map, plan and video document"
```

---

### Task 5: ffmpeg и ingest

**Files:**
- Create: `src/lib/ffmpeg.ts`, `src/lib/ffmpeg.test.ts`, `src/worker/steps/ingest.ts`, `src/worker/steps/ingest.test.ts`

**Interfaces:**
- Produces в `ffmpeg.ts`: `class IngestError extends Error`; `runFfmpeg(args: string[]): Promise<{ stdout: string; stderr: string }>` (через `node:child_process` `execFile`, `maxBuffer` 64 МБ, при ненулевом коде бросает `IngestError` с хвостом stderr); `probe(file: string): Promise<MediaInfo>` (ffprobe `-print_format json -show_streams -show_format`, бросает `IngestError("Not a video file: <path>")`, если нет видеопотока, и `IngestError("ffmpeg is not installed")`, если бинарь не найден); `makeTestVideo(outPath: string, seconds: number): Promise<void>` (lavfi `testsrc2=size=640x360:rate=30` + `sine=frequency=440`, для тестов).
- Produces в `ingest.ts`: `ingest(input: { source: string; runDir: string }): Promise<IngestResult>` где `IngestResult = { info: MediaInfo; audioPath: string; keyframes: { tMs: number; path: string }[]; shots: Shot[] }`; аудио `audio.wav` моно 16 кГц; ключевые кадры `frames/%04d.jpg` с шагом 2000 мс, ширина 640; планы через фильтр `select='gt(scene,0.3)',showinfo`; `parseSceneTimestamps(stderr: string): number[]` достаёт `pts_time` из строк `showinfo` в миллисекундах; `shotsFromCuts(cutsMs: number[], durationMs: number): Shot[]`.

- [ ] **Step 1: Падающие тесты.**

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

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/lib/ffmpeg src/worker/steps/ingest`. Expected: FAIL.

- [ ] **Step 3: Реализовать** по Interfaces. Длительность из `format.duration`, fps из `r_frame_rate` видеопотока.

- [ ] **Step 4: Прогнать.** Run: `pnpm test -- src/lib/ffmpeg src/worker/steps/ingest`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(worker): ffmpeg helpers and ingest step"
```

---

### Task 6: Расшифровка: ElevenLabs и Deepgram

**Files:**
- Create: `src/worker/steps/transcribe/types.ts`, `src/worker/steps/transcribe/elevenlabs.ts`, `src/worker/steps/transcribe/deepgram.ts`, `src/worker/steps/transcribe/normalize.test.ts`, `src/lib/pricing.ts`, `src/lib/metrics.ts`, `src/lib/metrics.test.ts`, `fixtures/transcript.elevenlabs.json`, `fixtures/transcript.deepgram.json`

**Interfaces:**
- Produces в `pricing.ts`: `claudeUsd(model: string, usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }): number` с таблицей за миллион токенов (вход / выход / кэш-чтение / запись в кэш): `claude-opus-5-5` 4 / 20 / 0.2 / 5; `claude-sonnet-5-5` 2 / 10 / 0.2 / 2.5; `claude-haiku-5-5` 0.1 / 0.5 / 0.01 / 0.125; неизвестная модель бросает `Error("No price for model <id>")`. Константы `ELEVENLABS_STT_USD_PER_MIN = 0.0067`, `DEEPGRAM_USD_PER_MIN = 0.0077`, `ELEVENLABS_TTS_USD_PER_1K_CHARS = 0.3`, `REKOGNITION_USD_PER_IMAGE = 0.001`, каждая с полем `note: "estimate, check the dashboard"` в объекте `pricingNotes`.
- Produces в `metrics.ts`: `type UsageEvent = { step: string; provider: "anthropic" | "elevenlabs" | "deepgram" | "rekognition" | "lambda" | "ffmpeg"; ms: number; usd: number; detail?: Record<string, number | string> }`; `class Metrics { record(event: UsageEvent): void; total(): { ms: number; usd: number }; byStep(): Record<string, { ms: number; usd: number }>; toJSON(): UsageEvent[]; static from(events: UsageEvent[]): Metrics }`; `timed<T>(metrics: Metrics, step: string, provider: UsageEvent["provider"], fn: () => Promise<{ value: T; usd: number; detail?: UsageEvent["detail"] }>): Promise<T>`.
- Produces в `types.ts`: `interface Transcriber { name: "elevenlabs" | "deepgram"; transcribe(audioPath: string, durationMs: number): Promise<{ transcript: Transcript; usd: number }> }`.
- Produces в `elevenlabs.ts`: `ElevenLabsSttResponseSchema` (поля `language_code`, `text`, `words[]` с `text`, `start`, `end`, `type` ∈ `word | spacing | audio_event`, `speaker_id?`), `normalizeElevenLabs(res: ElevenLabsSttResponse): Transcript` (берёт только `type === "word"`, секунды в миллисекунды, `speaker_id` в `speaker`), `elevenLabsTranscriber(apiKey: string): Transcriber` (POST `https://api.elevenlabs.io/v1/speech-to-text`, multipart `FormData` с `file`, `model_id=scribe_v2`, `timestamps_granularity=word`, `diarize=true`, заголовок `xi-api-key`; стоимость `durationMs / 60000 * ELEVENLABS_STT_USD_PER_MIN`).
- Produces в `deepgram.ts`: `normalizeDeepgram(res: unknown): Transcript` (Zod по пути `results.channels[0].alternatives[0]` с `transcript`, `words[]` `{ word, punctuated_word?, start, end, speaker? }`, язык из `results.channels[0].detected_language` или `"unknown"`), `deepgramTranscriber(apiKey: string): Transcriber` (`new DeepgramClient({ apiKey })`, `listen.v1.media.transcribeFile(createReadStream(audioPath), { model: "nova-3", smart_format: true, diarize: true, detect_language: true })`).

- [ ] **Step 1: Фикстуры.** Два JSON-ответа по десять слов, включая слово с кириллицей и паузу (`spacing`) у ElevenLabs, два спикера у обоих.

- [ ] **Step 2: Падающие тесты.**

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
test("Metrics sums by step", () => { /* две записи в один шаг складываются */ });
```

- [ ] **Step 3: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/worker/steps/transcribe src/lib/metrics`. Expected: FAIL.

- [ ] **Step 4: Установить** `pnpm add @deepgram/sdk`. Реализовать по Interfaces. Сетевые функции не тестируются юнитами.

- [ ] **Step 5: Прогнать.** Run: `pnpm test -- src/worker/steps/transcribe src/lib/metrics && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(worker): transcription via elevenlabs scribe and deepgram, pricing and metrics"
```

---

### Task 7: Понимание кадра: лица и описания

**Files:**
- Create: `src/lib/ai/claude.ts`, `src/worker/steps/see/faces.ts`, `src/worker/steps/see/faces.test.ts`, `src/worker/steps/see/describe.ts`, `src/worker/steps/see/describe.test.ts`, `src/worker/steps/see/contentMap.ts`

**Interfaces:**
- Produces в `claude.ts`: `createClaude(apiKey: string): Anthropic` (`new Anthropic({ apiKey })`); `withFallback = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as const`; `textOf(message: Anthropic.Beta.BetaMessage): string` (склейка текстовых блоков); `assertNotRefused(message)` бросает `Error("Claude refused: <category>")` при `stop_reason === "refusal"`.
- Produces в `faces.ts`: `interface FaceDetector { detect(frame: { tMs: number; path: string }): Promise<FaceBox[]> }`; `rekognitionDetector(region: string): FaceDetector` (`DetectFacesCommand({ Image: { Bytes }, Attributes: ["DEFAULT"] })`, `BoundingBox.Left/Top/Width/Height` в `x/y/w/h`); `detectFaces(detector, frames, metrics): Promise<FaceBox[]>` (последовательно, стоимость `frames.length * REKOGNITION_USD_PER_IMAGE`); `avoidZones(faces: FaceBox[], interval: { startMs: number; endMs: number }, padding = 0.04): Box[]` (объединение прямоугольников с `tMs` внутри интервала, расширенных на `padding`, слитых, если пересекаются).
- Produces в `describe.ts`: `selectFramesForDescription(frames: { tMs: number; path: string }[], shots: Shot[], max = 60): typeof frames` (сначала ближайший кадр к началу каждого плана, потом равномерно по времени до `max`, без повторов, по возрастанию `tMs`); `batch<T>(items: T[], size: number): T[][]`; `estimateVisionUsd(frameCount: number, model: string): number` (1 600 токенов на кадр 640 px по цене входа модели плюс 200 выходных токенов на кадр); `describeKeyframes(input: { client: Anthropic; model: string; frames: { tMs: number; path: string }[]; budgetUsd: number; metrics: Metrics }): Promise<FrameNote[]>` (пачки по 20 кадров, одна пачка = один вызов `client.beta.messages.create` с `...withFallback`, `output_config: { effort: "low", format: zodOutputFormat(z.object({ frames: z.array(FrameNoteSchema) })) }`, `max_tokens: 16000`, картинки как `image/jpeg` base64, в тексте запрос описать каждый кадр по индексу и времени; результат парсится Zod; при `estimateVisionUsd > budgetUsd` бросает `Error("Vision budget exceeded: <est> > <budget>")` до первого вызова).
- Produces в `contentMap.ts`: `buildContentMap(input: { source: string; info: MediaInfo; shots: Shot[]; faces: FaceBox[]; frames: FrameNote[]; transcript: Transcript | null }): ContentMap`.

- [ ] **Step 1: Падающие тесты.**

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

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/worker/steps/see`. Expected: FAIL.

- [ ] **Step 3: Установить** `pnpm add @anthropic-ai/sdk @aws-sdk/client-rekognition`. Реализовать по Interfaces. `zodOutputFormat` импортируется из `@anthropic-ai/sdk/helpers/zod`.

- [ ] **Step 4: Прогнать.** Run: `pnpm test -- src/worker/steps/see && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(worker): face detection, keyframe descriptions and content map"
```

---

### Task 8: Режиссёр

**Files:**
- Create: `src/worker/steps/direct/prompts.ts`, `src/worker/steps/direct/prompts.test.ts`, `src/worker/steps/direct/director.ts`, `src/worker/steps/direct/director.test.ts`, `src/lib/html.ts`, `src/lib/html.test.ts`, `fixtures/content.sample.json`

**Interfaces:**
- Consumes: `PlanSchema`, `ContentMap`, `destinations`, `registers`, `createClaude`, `withFallback`, `Metrics`, `claudeUsd`.
- Produces в `html.ts`: `pageText(html: string, maxChars = 8000): string` (убирает `script`, `style`, теги, схлопывает пробелы, обрезает); `fetchPageText(url: string): Promise<string>`.
- Produces в `prompts.ts`: `directorSystemPrompt(): string` (стабильная строка без дат: роль режиссёра, три режима, словарь примитивов этапа 0 с полями, таблица назначений и безопасных зон, таблица регистров, правила: сумма битов равна длине, первая секунда без пустого кадра, не больше `maxElements` на бит, слов на экране не больше 6, вопросы только о том, что меняет результат и чего не угадать, не больше трёх, у каждого дефолт; язык копирайта равен языку исходника или запроса; при пустой расшифровке план строится по кадрам и без субтитров); `directorUserMessage(input: DirectorInput): string` где `DirectorInput = { mode: "footage" | "text"; destination: DestinationId; content?: ContentMap; text?: string; pageText?: string; brand?: { colors: string[]; font: string } }` (расшифровка словами с таймкодами раз в предложение, планы, заметки по кадрам, лица как «человек в кадре с … по …», потолок длины назначения, длина исходника).
- Правило для структурированного вывода: ограничения количества (`min`, `max`, длины массивов) живут в `superRefine`, а не в JSON-схеме, которую строит `zodOutputFormat`; если API отвергает схему, убрать из неё спорное ограничение и проверять его в `superRefine`.
- Produces в `director.ts`: `direct(input: DirectorInput, deps: { client: Anthropic; model: string; metrics: Metrics }): Promise<Plan>`: `client.beta.messages.create` с `...withFallback`, `model`, `max_tokens: 16000`, `output_config: { effort: "high", format: zodOutputFormat(PlanSchema) }`, `system: [{ type: "text", text: directorSystemPrompt(), cache_control: { type: "ephemeral" } }]`, `messages: [{ role: "user", content: directorUserMessage(input) }]`; `assertNotRefused`; текст парсится `JSON.parse` и `PlanSchema.parse`; при ошибке схемы один повтор с текстом ошибки в следующем сообщении пользователя; метрика `step: "direct"` с токенами и `claudeUsd`.

- [ ] **Step 1: Падающие тесты.**

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

- [ ] **Step 2: Фикстура** `fixtures/content.sample.json`: карта контента 48-секундного интервью с четырьмя планами, лицом в левой трети и расшифровкой на 60 слов.

- [ ] **Step 3: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/worker/steps/direct src/lib/html`. Expected: FAIL.

- [ ] **Step 4: Реализовать** по Interfaces. Фейковый клиент в тестах это объект с `beta.messages.create`, который отдаёт очередь ответов.

- [ ] **Step 5: Прогнать.** Run: `pnpm test -- src/worker/steps/direct src/lib/html && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(worker): director step with structured plan output and cached system prompt"
```

---

### Task 9: Сборка: план в документ ролика

**Files:**
- Create: `src/video/layout/fitCover.ts`, `src/video/layout/fitCover.test.ts`, `src/video/layout/safeZones.ts`, `src/video/layout/safeZones.test.ts`, `src/video/captions/timeline.ts`, `src/video/captions/pages.ts`, `src/video/captions/pages.test.ts`, `src/video/audio/ducking.ts`, `src/video/audio/ducking.test.ts`, `src/worker/steps/build/buildVideo.ts`, `src/worker/steps/build/buildVideo.test.ts`, `assets/music/manifest.json`

**Interfaces:**
- Consumes: `Plan`, `ContentMap`, `VideoDocSchema`, `destinations`, `formatSize`, `registers`, `avoidZones`, `createTikTokStyleCaptions` из `@remotion/captions`.
- Produces в `fitCover.ts`: `fitCover(source: { width: number; height: number }, target: { width: number; height: number }, focus?: { x: number; y: number }): { scale: number; x: number; y: number }` (scale = max по осям, сдвиг центрирует, при `focus` сдвиг ставит точку фокуса в центр, но не дальше краёв).
- Produces в `safeZones.ts`: `placeOverlay(kind: OverlayKind, format: Format, safeZone: Destination["safeZone"], avoid: Box[]): Box`. Кандидаты по порядку, берётся первый, не пересекающий `avoid`, иначе первый: headline `[top-center, bottom-center, middle-center]`; chip и lower-third `[bottom-left, bottom-right, top-left, top-right]`; big-number и quote `[middle-center, top-center, bottom-center]`; sticker `[top-right, top-left]`. Все слоты внутри `safeZone`. Ширина слота 0.84 от ширины внутри безопасной зоны для headline и quote, 0.6 для остальных; высота 0.18 для headline, 0.12 для quote и big-number, 0.08 для chip, lower-third и sticker.
- Produces в `timeline.ts`: `rebaseWords(words: TranscriptWord[], footage: { fromMs: number; toMs: number }, sceneStartMs: number): TranscriptWord[]` (слова внутри интервала, время сдвинуто на `sceneStartMs - fromMs`).
- Produces в `pages.ts`: `captionPages(words: TranscriptWord[], combineWithinMs = 1200): CaptionPage[]` через `createTikTokStyleCaptions({ captions: words.map(...), combineTokensWithinMilliseconds })` с `Caption = { text: " " + word, startMs, endMs, timestampMs: null, confidence: null }`.
- Produces в `ducking.ts`: `speechIntervals(words: TranscriptWord[], gapMs = 300): { startMs: number; endMs: number }[]`; `musicVolumeAt(ms: number, speech: { startMs: number; endMs: number }[], base = 0.9, duckTo = 0.25, rampMs = 200): number`.
- Produces в `buildVideo.ts`: `type BuildAssets = { sourceVideo?: { path: string; info: MediaInfo }; music?: { path: string; durationMs: number }; voice?: { beatId: string; path: string; durationMs: number; words: TranscriptWord[] }[] }`; `buildVideo(plan: Plan, content: ContentMap | null, assets: BuildAssets, brand: VideoDoc["brand"]): VideoDoc` (сцена на бит с тем же `id`; элементы из overlays с id `${beatId}-${overlayId}`; футаж с `fitCover` и фокусом на центре лиц сцены; субтитры из `rebaseWords` по всем сценам с футажом, а в текстовом режиме из слов озвучки; музыка из `assets.music` с `speech` из `speechIntervals`; голос по сценам с `atMs = scene.startMs`; при `voice` длительность сцены не меньше длительности озвучки плюс 300 мс, остальные сцены ужимаются пропорционально, чтобы сумма осталась равной `plan.lengthMs`; результат проходит `VideoDocSchema.parse`); `pickMusic(manifest, mood: string): { path; durationMs } | undefined`.
- `assets/music/manifest.json`: `{ "tracks": [] }` и в README-строке файла (поле `note`) что треки кладёт владелец с полями `file, title, mood, bpm, license, source`.

- [ ] **Step 1: Падающие тесты.**

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
test("buildVideo stretches a scene to fit its voice and keeps the total", () => { /* текстовый план, голос 4000 мс в сцене на 2000 мс, сумма остаётся 15000 */ });
```

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/video src/worker/steps/build`. Expected: FAIL.

- [ ] **Step 3: Установить Remotion** одной командой с одинаковой версией: `pnpm add remotion@latest @remotion/cli@latest @remotion/bundler@latest @remotion/renderer@latest @remotion/media@latest @remotion/captions@latest @remotion/google-fonts@latest @remotion/layout-utils@latest @remotion/lambda@latest react@latest react-dom@latest` и `pnpm add -D @types/react @types/react-dom`. Проверить: `grep '"@remotion/' package.json` показывает одну и ту же версию.

- [ ] **Step 4: Реализовать** по Interfaces.

- [ ] **Step 5: Прогнать.** Run: `pnpm test -- src/video src/worker/steps/build && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(video): layout, captions, ducking and plan-to-document build"
```

---

### Task 10: Композиция Remotion и примитивы

**Files:**
- Create: `src/video/remotion/index.ts`, `src/video/remotion/Root.tsx`, `src/video/remotion/SaymoVideo.tsx`, `src/video/remotion/fonts.ts`, `src/video/remotion/sample.test.ts`, `src/video/remotion/primitives/Background.tsx`, `Footage.tsx`, `Camera.tsx`, `Headline.tsx`, `Chip.tsx`, `BigNumber.tsx`, `LowerThird.tsx`, `Captions.tsx`, `MusicTrack.tsx`, `VoiceTrack.tsx`, `src/video/remotion/frames.ts`, `src/video/remotion/frames.test.ts`, `remotion.config.ts`, `fixtures/video.sample.json`
- Modify: `package.json` (скрипты `remotion:studio` = `remotion studio src/video/remotion/index.ts`, `remotion:still` = `remotion still src/video/remotion/index.ts saymo --props=fixtures/video.sample.json --frame=45 runs/still.png`, `remotion:render` = `remotion render src/video/remotion/index.ts saymo --props=fixtures/video.sample.json runs/sample.mp4`)

**Interfaces:**
- Consumes: `VideoDoc`, `formatSize`, `registers`, `musicVolumeAt`.
- Produces в `frames.ts`: `msToFrame(ms: number, fps = 30): number` (округление), `frameToMs`.
- Produces в `fonts.ts`: `loadBrandFont(family: string): { fontFamily: string }` через `@remotion/google-fonts/Onest` `loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "cyrillic"] })`; для этапа 0 поддерживается только Onest, другое семейство падает на Onest.
- Produces в `Root.tsx`: `<Composition id="saymo" component={SaymoVideo} defaultProps={sampleDoc} calculateMetadata={...} />`, где `calculateMetadata` берёт `fps`, `durationInFrames = msToFrame(durationMs)`, `width/height = formatSize(format)` из props.
- Produces в `SaymoVideo.tsx`: `SaymoVideo({ doc }: { doc: VideoDoc })`: сцены как `<Sequence from durationInFrames>`, внутри `Background`, `Footage` (если есть), `Camera` оборачивает содержимое, элементы по `kind`, после сцен `Captions`, `MusicTrack`, `VoiceTrack`. Каждый элемент получает `data-element-id={element.id}` на корневом div.
- Примитивы: `Footage` использует `<Video>` из `@remotion/media` с `src`, `trimBefore={msToFrame(fromMs)}`, `durationInFrames`, `muted={false}`, стиль `transform: scale(...) translate(...)` из `transform`; `Camera` для `push` плавно растит scale от 1 до `1 + 0.08 * intensity` за сцену, `punch-in` скачком на `1 + 0.15 * intensity` в начале, `pan` сдвиг по x на `4% * intensity`; текстовые примитивы используют регистр для веса шрифта и `interpolate`/`spring` для появления (mask up за `staggerMs * 6` мс) и `fitText` из `@remotion/layout-utils` для подбора размера в `box`; `Captions` рисует страницу в нижней части кадра, нижний край на `1 - safeZone.bottom - 0.02` высоты, у `karaoke` активный токен цветом бренда `colors[1] ?? colors[0]`, у `box` плашка, у `pop` увеличение активного токена; `MusicTrack` это `<Audio>` с `volume={(f) => musicVolumeAt(frameToMs(f), speech, volume, duckTo)}`; `VoiceTrack` это `<Audio>` на `atMs`.
- `index.ts`: `registerRoot(Root)`.
- `remotion.config.ts`: `Config.setVideoImageFormat("jpeg")`, `Config.setOverwriteOutput(true)`.

- [ ] **Step 1: Фикстура** `fixtures/video.sample.json`: документ на 15 с, 9:16, `reels`, `driving-launch`, бренд `{ colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"], font: "Onest" }`, три сцены с теми же id, что биты `fixtures/plan.text.json` (headline; chip и big-number; sticker), без футажа, без музыки, без голоса, субтитры `karaoke` из трёх страниц по два-три токена.

- [ ] **Step 2: Падающие тесты.** `frames.test.ts`: `msToFrame(1000)` = 30, `msToFrame(1016)` = 30, `msToFrame(1017)` = 31 (округление к ближайшему). `sample.test.ts`: `VideoDocSchema.parse(sampleDoc)` не бросает, `sampleDoc.durationMs` = 15000, у `sampleDoc.captions.pages` три страницы. Фикстура пишется руками по схеме задачи 4.

- [ ] **Step 3: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/video/remotion`. Expected: FAIL.

- [ ] **Step 4: Реализовать** по Interfaces.

- [ ] **Step 5: Кадр.** Run: `pnpm remotion:still`. Expected: `runs/still.png` существует, на нём заголовок из фикстуры в цветах бренда, без вылета текста за кадр (посмотреть глазами).

- [ ] **Step 6: Рендер фикстуры.** Run: `pnpm remotion:render`. Expected: `runs/sample.mp4` 15 секунд, `ffprobe` показывает 1080×1920 и 30 fps.

- [ ] **Step 7: Прогнать тесты и typecheck.** Run: `pnpm test && pnpm typecheck && pnpm check`. Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add -A && git commit -m "feat(video): remotion composition with footage, text, captions and audio primitives"
```

---

### Task 11: QA документа

**Files:**
- Create: `src/video/layout/textWidth.ts`, `src/video/layout/textWidth.test.ts`, `src/video/qa/checks.ts`, `src/video/qa/checks.test.ts`

**Interfaces:**
- Consumes: `VideoDoc`, `Plan`, `destinations`, `registers`, `formatSize`.
- Produces в `textWidth.ts`: `estimateTextWidth(text: string, fontSizePx: number): number` (0.58 · размер на латинский символ, 0.64 на кириллический, 0.3 на пробел); `fitsInBox(text: string, box: Box, format: Format, maxLines: number, fontSizePx: number): boolean`.
- Produces в `checks.ts`: `type QaIssue = { code: "scenes-sum" | "min-hold" | "words-on-screen" | "text-overflow" | "safe-zone" | "avoid-zone" | "voice-overflow" | "plan-over-cap" | "plan-over-source"; severity: "error" | "warning"; message: string; sceneId?: string; elementId?: string }`; `type QaReport = { ok: boolean; issues: QaIssue[] }`; `planWithinLimits(plan: Plan, sourceDurationMs: number | null): QaIssue[]`; `runQa(doc: VideoDoc, plan: Plan, avoid: Record<string, Box[]>, sourceDurationMs: number | null): QaReport` (`ok` = нет issue с `severity: "error"`; words-on-screen считает слова всех видимых элементов сцены против 6, error; min-hold против `registers[doc.register].minHoldMs`, warning; safe-zone проверяет, что `box` элемента внутри `safeZone` назначения, error; avoid-zone проверяет пересечение `box` с `avoid[sceneId]`, error; text-overflow через `fitsInBox` с 2 строками и размером 72 px для headline, 40 для остальных, warning; voice-overflow если озвучка длиннее сцены, error).

- [ ] **Step 1: Падающие тесты.**

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
test("runQa flags seven words on screen", () => { /* элемент с семью словами даёт words-on-screen */ });
test("estimateTextWidth is wider for cyrillic", () => { expect(estimateTextWidth("Привет", 72)).toBeGreaterThan(estimateTextWidth("Hello!", 72)); });
```

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/video/qa src/video/layout/textWidth`. Expected: FAIL.

- [ ] **Step 3: Реализовать** по Interfaces.

- [ ] **Step 4: Прогнать.** Run: `pnpm test -- src/video/qa src/video/layout/textWidth && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(video): deterministic qa checks for documents and plans"
```

---

### Task 12: Локальный рендер и постер

**Files:**
- Create: `src/video/render/renderLocal.ts`, `src/video/render/renderLocal.test.ts`, `src/cli/renderFixture.ts`
- Modify: `package.json` (скрипт `render:fixture` = `tsx src/cli/renderFixture.ts`)

**Interfaces:**
- Consumes: `VideoDoc`, `msToFrame`, `@remotion/bundler` `bundle`, `@remotion/renderer` `selectComposition`, `renderMedia`, `renderStill`.
- Produces: `bundleOnce(): Promise<string>` (бандл `src/video/remotion/index.ts` в `.remotion/bundle`, кэш в памяти процесса); `renderLocal(doc: VideoDoc, outPath: string): Promise<{ ms: number }>` (`selectComposition({ serveUrl, id: "saymo", inputProps: { doc } })`, `renderMedia({ composition, serveUrl, codec: "h264", outputLocation: outPath, inputProps: { doc } })`); `renderPoster(doc: VideoDoc, outPath: string, atMs: number): Promise<void>` (`renderStill` с `frame: msToFrame(atMs)`, формат `jpeg`); `posterTimeMs(doc: VideoDoc): number` (середина первой сцены с элементом `headline`, иначе середина первой сцены).

- [ ] **Step 1: Падающий тест** `renderLocal.test.ts` только на `posterTimeMs`: для `sampleDoc` возвращает середину первой сцены с headline.

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/video/render`. Expected: FAIL.

- [ ] **Step 3: Реализовать** по Interfaces.

- [ ] **Step 4: Проверить рендером.** `src/cli/renderFixture.ts` читает `fixtures/video.sample.json`, валидирует `VideoDocSchema`, зовёт `renderLocal` в `runs/render-test/out.mp4` и `renderPoster` в `runs/render-test/poster.jpg` на `posterTimeMs`, печатает миллисекунды. Run: `pnpm render:fixture`. Expected: оба файла есть, время рендера напечатано.

- [ ] **Step 5: Прогнать.** Run: `pnpm test -- src/video/render && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(video): local render and poster frame"
```

---

### Task 13: Озвучка ElevenLabs с таймингами

**Files:**
- Create: `src/worker/steps/voice/elevenlabsVoice.ts`, `src/worker/steps/voice/elevenlabsVoice.test.ts`

**Interfaces:**
- Consumes: `TranscriptWord`, `ELEVENLABS_TTS_USD_PER_1K_CHARS`, `Metrics`.
- Produces: `ElevenLabsTtsResponseSchema` (`audio_base64`, `alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } | null`); `wordsFromAlignment(alignment): TranscriptWord[]` (символы группируются по пробелам; время слова от первого до последнего символа, в миллисекундах); `synthesizeVoice(input: { apiKey: string; voiceId: string; text: string; outPath: string; metrics: Metrics }): Promise<{ path: string; durationMs: number; words: TranscriptWord[] }>` (POST `https://api.elevenlabs.io/v1/text-to-speech/<voiceId>/with-timestamps?output_format=mp3_44100_128`, JSON `{ text, model_id: "eleven_multilingual_v2" }`, заголовок `xi-api-key`; аудио пишется из base64; `durationMs` из `probe`; стоимость `text.length / 1000 * ELEVENLABS_TTS_USD_PER_1K_CHARS`).

- [ ] **Step 1: Падающий тест.**

```ts
test("wordsFromAlignment groups characters into words", () => {
  const words = wordsFromAlignment({ characters: ["H", "i", " ", "a", "l", "l"], character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5], character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] });
  expect(words).toEqual([{ text: "Hi", startMs: 0, endMs: 200 }, { text: "all", startMs: 300, endMs: 600 }]);
});
```

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/worker/steps/voice`. Expected: FAIL.

- [ ] **Step 3: Реализовать** по Interfaces.

- [ ] **Step 4: Прогнать.** Run: `pnpm test -- src/worker/steps/voice && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(worker): elevenlabs voice with word timings"
```

---

### Task 14: Прогон, манифест и команда spike

**Files:**
- Create: `src/worker/manifest.ts`, `src/worker/manifest.test.ts`, `src/worker/run.ts`, `src/cli/spike.ts`
- Modify: `package.json` (скрипт `spike` = `tsx src/cli/spike.ts`), `docs/pipeline.md` (раздел «Прогон спайка»: папка прогона и файлы)

**Interfaces:**
- Consumes: всё из задач 5–13.
- Produces в `manifest.ts`: `RunOptionsSchema` и тип `RunOptions` (поля ниже), `StepName = "ingest" | "transcribe" | "see" | "direct" | "voice" | "build" | "qa" | "render"`; `ManifestSchema` `{ id: string; createdAt: string; options: RunOptions; steps: Record<StepName, { status: "pending" | "done" | "failed" | "skipped"; ms?: number; error?: string }>; events: UsageEvent[] }`; `loadOrCreateManifest(runDir, options): Manifest`; `saveManifest(runDir, manifest): void`; `shouldRun(manifest, step, resume: boolean): boolean` (при `resume` пропускает `done`).
- `RunOptions = { source?: string; text?: string; url?: string; destination: DestinationId; runDir: string; transcriber: "elevenlabs" | "deepgram"; directorModel: string; visionModel: string; voice: boolean; voiceId: string; render: "local" | "lambda" | "none"; resume: boolean }`.
- Produces в `run.ts`: `defaultBrand: VideoDoc["brand"] = { colors: ["#2D4BFF", "#FFD23F", "#FFFFFF"], font: "Onest" }`; `runPipeline(options: RunOptions, env: Env): Promise<{ manifest: Manifest; planPath: string; docPath: string; outputPath?: string }>`: шаги по порядку, каждый пишет артефакт (`ingest.json`, `transcript.json`, `content.json`, `plan.json`, `voice/*.mp3`, `video.json`, `qa.json`, `out.mp4`, `poster.jpg`, `metrics.json`) и обновляет манифест; в текстовом режиме `ingest`, `transcribe`, `see` получают `skipped`; `transcribe` и `see` идут через `Promise.all`; `voice` выполняется только в текстовом режиме при `options.voice && plan.voiceover`, иначе `skipped`; в футажном режиме музыка берётся через `pickMusic(manifest, plan.musicMood)`; после `direct` вопросы печатаются в консоль с дефолтами и прогон продолжается с дефолтами; при `qa.ok === false` шаг `render` получает `failed` с текстом ошибок и прогон завершается кодом 2; `metrics.json` это `Metrics.toJSON()` плюс `byStep()` и `total()`.
- Produces в `spike.ts`: разбор аргументов через `node:util` `parseArgs`: позиционный путь к видео либо `--text`, `--url`, `--to` (default `reels`), `--transcriber` (default `elevenlabs`), `--director-model`, `--vision-model`, `--voice` (boolean), `--voice-id` (default `21m00Tcm4TlvDq8ikWAM`), `--render` (default `local`), `--resume` (boolean), `--run` (id существующего прогона); `process.loadEnvFile(".env")`, если файл есть; `runDir = runs/<id>` где id = `<yyyymmdd-hhmm>-<slug входа>`; в конце печатает таблицу `byStep()` и итог.

- [ ] **Step 1: Падающий тест** `manifest.test.ts`: `shouldRun` возвращает `false` для `done` при `resume: true` и `true` без resume; `loadOrCreateManifest` создаёт файл с восемью шагами в `pending`.

- [ ] **Step 2: Прогнать, убедиться, что падает.** Run: `pnpm test -- src/worker/manifest`. Expected: FAIL.

- [ ] **Step 3: Реализовать** `manifest.ts`, `run.ts`, `spike.ts` по Interfaces.

- [ ] **Step 4: Прогнать тесты.** Run: `pnpm test && pnpm typecheck && pnpm check`. Expected: PASS.

- [ ] **Step 5: Сухой прогон текстового режима без сети.** Run: `pnpm spike --text "Reports now export to PDF" --to reels --render none` с пустым `ANTHROPIC_API_KEY`. Expected: понятная ошибка `Set ANTHROPIC_API_KEY in .env` до первого вызова модели.

- [ ] **Step 6: Первый настоящий прогон.** Заполнить `.env` ключами Anthropic. Run: `pnpm spike --text "Announce a new feature: reports now export to PDF. Upbeat." --to reels`. Expected: `runs/<id>/out.mp4` играет, `metrics.json` содержит шаги `direct`, `build`, `qa`, `render` с миллисекундами и долларами.

- [ ] **Step 7: Commit.**

```bash
git add -A && git commit -m "feat(worker): resumable pipeline run and spike command"
```

---

### Task 15: Рендер на Lambda

**Files:**
- Create: `src/video/render/renderLambda.ts`, `docs/runbooks/lambda.md`
- Modify: `src/worker/run.ts` (ветка `render: "lambda"`), `.env.example`

**Interfaces:**
- Consumes: `VideoDoc`, `Env`, `Metrics`.
- Produces в `renderLambda.ts`: `renderOnLambda(input: { doc: VideoDoc; outName: string; env: Env; metrics: Metrics }): Promise<{ url: string; ms: number; usd: number }>`: `renderMediaOnLambda({ region: env.AWS_REGION, functionName: requireEnv(env, "REMOTION_LAMBDA_FUNCTION_NAME"), serveUrl: requireEnv(env, "REMOTION_SERVE_URL"), composition: "saymo", inputProps: { doc }, codec: "h264", outName, privacy: "public" })` из `@remotion/lambda/client`, затем опрос `getRenderProgress({ renderId, bucketName, functionName, region })` каждые 1000 мс до `done`; при `fatalErrorEncountered` бросает `Error` с `errors`; `usd` из `costs.accruedSoFar`, `url` из `outputFile`.

- [ ] **Step 1: Инструкция** `docs/runbooks/lambda.md` по шагам из документации Remotion: `npx remotion lambda policies role` → политика `remotion-lambda-policy` → роль `remotion-lambda-role`; пользователь IAM, `npx remotion lambda policies user` как inline-политика плюс действие `rekognition:DetectFaces`; ключи в `.env` как `REMOTION_AWS_ACCESS_KEY_ID` и `REMOTION_AWS_SECRET_ACCESS_KEY` (и те же значения в `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` для Rekognition); `npx remotion lambda policies validate`; `npx remotion lambda functions deploy --memory=2048 --timeout=120`; `npx remotion lambda sites create src/video/remotion/index.ts --site-name=saymo` → `REMOTION_SERVE_URL`; `npx remotion lambda quotas`.

- [ ] **Step 2: Реализовать** `renderLambda.ts` и ветку в `run.ts`.

- [ ] **Step 3: Выполнить инструкцию** на аккаунте владельца (ключи не коммитить). Run: `npx remotion lambda render $REMOTION_SERVE_URL saymo --props=fixtures/video.sample.json`. Expected: ссылка на MP4 в S3, файл играет.

- [ ] **Step 4: Прогон через конвейер.** Run: `pnpm spike --run <id из задачи 14> --resume --render lambda`. Expected: `metrics.json` содержит шаг `render` с `provider: "lambda"`, `ms` и `usd`.

- [ ] **Step 5: Прогнать.** Run: `pnpm typecheck && pnpm check`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "feat(video): render on remotion lambda with cost tracking"
```

---

### Task 16: Прогоны спайка и решения

**Files:**
- Modify: `docs/spike-results.md`, `docs/product/decisions.md`, `docs/learnings.md`

- [ ] **Step 1: Исходники.** Положить в `runs/inputs/` (не в git) три файла владельца: интервью с лицом (2–5 минут, 16:9), экранная запись с голосом (1–3 минуты), вертикальная съёмка с телефона (1–2 минуты). Два текста: лонч фичи и распродажа.

- [ ] **Step 2: Прогоны.** Для каждого исходника: `pnpm spike <файл> --to reels --transcriber elevenlabs`, затем `--resume --transcriber deepgram` в новый прогон (без `--resume`, чтобы сравнить расшифровку). Тексты: `pnpm spike --text "..." --to reels --voice` и `pnpm spike --text "..." --to linkedin`. Один прогон режиссёра повторить с `--director-model claude-sonnet-5-5`, один с `--vision-model claude-sonnet-5-5` и один с `--vision-model claude-haiku-5-5`.

- [ ] **Step 3: Таблица.** Заполнить `docs/spike-results.md` строками из `metrics.json` и оценками глазами. Для каждого прогона записать, задавал ли режиссёр вопросы и какие.

- [ ] **Step 4: Решения.** Через скилл `decision` записать: провайдер расшифровки, детекция (Rekognition остаётся или план на ONNX), модели режиссёра и зрения, потолок бюджета зрения на прогон, нужен ли критик уже сейчас. Через `learn` записать, что сломалось и чем лечить.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "docs: spike results and decisions on providers and models"
```

---

## Самопроверка по спеке

- Разделы 5 и 6 (схема, словарь): задачи 4, 9, 10. Примитивы этапа 0: фон, футаж, камера, заголовок, чип, цифра, плашка имени, субтитры трёх стилей, музыка с приглушением, голос. Остальной словарь (переходы кроме cut, Lottie, маркер и прочие акценты, камера pan по картинке) в этапе 1.
- Раздел 7 (конвейер): задачи 5–9, 13, 14. Вопросы режиссёра печатаются и принимаются по дефолту, экран вопросов в этапе 2.
- Раздел 10 (стек): задачи 1, 3, 9, 15.
- Раздел 11 (правила кода): задача 2, Global Constraints.
- Раздел 13 (этап 0, «готово, когда»): сайт документации и схема пути в задаче 3, три футажа и два текста в задаче 16, таблица и решения там же.
- Раздел 16 (скиллы, документация): задачи 2, 3.
- Review Focus: пункт 1 в задачах 8 и 9, пункт 2 в задаче 9, пункт 3 в задачах 9 и 10, пункт 4 в задаче 7, пункт 5 в задаче 11, пункт 6 в задаче 5.

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
