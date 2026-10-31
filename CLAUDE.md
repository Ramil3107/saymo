# Saymo

## What this is

- Saymo turns a user's video or text into a social video.
- A director running on a Claude model builds a plan of beats. The plan becomes the video document (data, not code), and Remotion renders the document to MP4.
- Stage 0 (scaffold and spike) is done; the next iteration is the vocabulary base, built locally and checked on `runs/face-v2`; the reference is Higgsfield for motion and motionvid for the use cases (see `docs/vocabulary.md`). The application, database, queue, storage and deployment come after it.

Spec: `docs/superpowers/specs/2026-10-28-saymo-v1-design.md`.

## How to work with me

- Everything in this repository is in English: docs, comments, commit messages, skills. Talk to the owner in Russian.
- The product interface is in English.
- When a decision on technology, a service or architecture is needed, propose 2–3 options with pros and cons and your recommendation. The decision is the owner's.
- Do not change technologies or architecture without an entry in `docs/product/decisions.md`.
- Stay within the scope of the first version from the spec. If something beyond it comes up, say so and ask.
- When showing the owner a render, say in one line what it proves and what is not there yet to be judged; the stage 0 spike was read as the product because that line was missing.
- If documents contradict each other or the design, do not guess: show the discrepancy and ask.
- Placeholders in square brackets (`[price]`, `[date]`) are open questions, not data.

## Code rules

- Code reads without comments: names say what is going on. A comment only where the "why" is not obvious, in one line.
- No long AI explanations, divider headings, "TODO: think about it" or dead code.
- Simple structure: vertical slices, small functions, no layers for the sake of layers. An abstraction appears on the third repetition, not earlier.
- Zod at every boundary: user input, model output, webhooks, env.
- Performance is considered while writing, not afterwards: server components, heavy things loaded lazily, indexes, no extra queries.
- Strict TypeScript, no any. Biome clean, tests green before every commit.
- Tests where there is logic: schema, operations, layout, QA, limits, webhooks. One e2e test for the main path.
- Interface strings only through localization keys. Styles only through tokens.
- Commits are small and meaningful. Decisions go in `docs/product/decisions.md`.

## Style

The code reads top-down like a book. In every file:

- Order: imports, constants and types, exported functions, then private helpers in the order they are first used.
- Functions are short, up to about 30 lines. A block that would need a comment becomes a named helper instead.
- Blank lines separate the steps of a function: gather, compute, return. Lines that belong together stay together.
- Early returns instead of nesting. No nested ternaries. A `switch` over a union has no `default`, so the compiler checks it is complete.
- Private helpers are function declarations, so the main function can sit above them.
- Magic numbers are named constants at the top of the file.
- Long command-line argument lists are assembled from named parts.
- No `as` casts and no non-null `!`: narrow with a check, a schema or a type guard. Zod schemas end in `Schema`; their types carry the bare name.
- Tests live in a `tests/` folder next to the module they test, one file per module: `src/video/layout/tests/safeZones.test.ts` tests `src/video/layout/safeZones.ts`.
- The Biome line width is 110. `pnpm format` settles the rest.

## Structure

Target structure from the spec, section 9. Stage 0 has `lib/`, `video/`, `worker/` and `cli/` (the `spike` command).

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
docs/             documentation pages, built into a VitePress site
```

- A slice does not import the internals of another slice, only its public entry.
- A screen is assembled from slices in `app/`.
- Everything about the video lives in `video/` and knows nothing about the database or users.

## Commands

- `pnpm check`: Biome, lint and formatting.
- `pnpm format`: fixes formatting after a red `pnpm check`.
- `pnpm typecheck`: type check, `tsc --noEmit`.
- `pnpm test`: tests, Vitest.
- `pnpm spike`: runs the pipeline on a video or text, details in the `spike` skill.
- `pnpm docs:dev`: the documentation site, locally.
- `pnpm docs:build`: builds the documentation site and fails on dead links.
- `pnpm docs:preview`: serves the built site.
- `pnpm remotion:studio`: Remotion Studio, composition preview.
- `pnpm remotion:lab`: renders the motion, type, accent, media and transition labs to `runs/lab/`, locally and without the API.
- `pnpm remotion:captions`: renders every caption preset over a clip of `runs/face-v2` to `runs/lab/caption-lab.mp4`.
- `pnpm render:plan <plan.json> --out <dir> [--style <id>]`: builds, checks and renders a text-mode plan locally, the plan written by hand or by the local director.
- `pnpm remotion:styles`: renders the same ad spot in every style to `runs/lab/style-lab.mp4`.
- `pnpm check:still <video> --from <s> --to <s> [--crop w:h:x:y]`: fails if a stretch that should stand still twitches beyond compression noise.

Environment:

- Start every command with `source ~/.nvm/nvm.sh && nvm use && pnpm …`: the agent's Bash calls do not share state, the default Node is 20 and the project needs 22.
- One test file: `pnpm test <path>`, not `pnpm test -- <path>` (pnpm 12 passes `--` along).
- If `pnpm add` reports ignored build scripts, run `pnpm approve-builds`.

## Skills

They live in `.claude/skills/`.

| Skill | When to call |
| --- | --- |
| `learn` | After a task or feedback from the owner: record a lesson and propose a rule |
| `decision` | A decision on technology, service, architecture or scope was made: record it in the log |
| `docs` | After code changes, before the commit: update the pages and the user flow diagram; they go in the same commit |
| `review` | Before the commit: self-check of the diff against the code rules |
| `vocab` | A new primitive is needed in the video vocabulary |
| `spike` | A spike needs to be run on a file or text and its measurements recorded |

## Definition of done

A task is done when:

- Biome is clean: `pnpm check`.
- Types check out: `pnpm typecheck`.
- Tests are green: `pnpm test`.
- Documentation is updated in the same commit as the change (`docs` skill).
- The decision is recorded in `docs/product/decisions.md` (`decision` skill), if one was made.

## Glossary

| Term | Meaning | In the UI |
| --- | --- | --- |
| video | One motion video of the user | video |
| edit | A request to change something, in words or with a quick button | edit |
| element | A part of the frame that can be selected: headline, logo, background, etc. | — |
| scene | A piece of the video with a start and a duration | scene |
| beat | A piece of the plan with a role, a time and content | — |
| brand | The user's logo, up to three colors and a font | brand |
| example | A ready-made scenario to start from: Product launch, Sale, etc. | example |
| editor | A hidden manual editor for the order, length and text of scenes | Editor |
| format | Aspect ratio of the frame: 9:16, 1:1, 16:9 | format |
| destination | Where the video will go, sets the format and the length ceiling | — |
| register | The character of the video, sets timings, curves and density | — |
| limit | How many videos can be made per month on the plan | — |
| review link | A view-only link to the video, no sign-in needed | review link |
