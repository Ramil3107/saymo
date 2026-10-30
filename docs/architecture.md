# Architecture

Summary of sections 9 and 10 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

## One app, two entry points

Next.js serves the interface and the API. The worker is a second entry point into the same code and runs the pipeline. The code that knows about videos (schema, vocabulary, operations, QA) lives in one folder and runs in three places: the browser preview, the build step in the worker and the render on Lambda. There is no monorepo until one is needed.

## Folders

This is the target layout. Stage 0 has only `lib/`, `video/`, `worker/` and `cli/` (the `spike` command). Tests sit in a `tests/` folder next to the module they cover.

```
src/
  app/        Next.js routes, thin: they assemble screens from slices
  features/   vertical slices, each with its own components, server actions, queries and tests
  video/      schema, operations, vocabulary, layout, QA, registers, catalog
  ui/         design system: tokens, primitives, icons
  worker/     worker entry, pipeline steps, queue
  lib/        thin infrastructure: db, env, storage, ai, jobs, i18n
messages/     interface strings, English only for now
docs/         these pages
```

Slices in `features/`: auth, brand, library, generation, editing, rendering, review, billing, account, admin, landing, emails.

## Import rules

- A slice never imports another slice's internals, only its public entry.
- A screen is assembled from slices in `app/`.
- Everything about the video lives in `video/` and knows nothing about the database or users.

## Stack

| Area | Choice |
| --- | --- |
| Language and runtime | TypeScript everywhere, Node 22, pnpm |
| Interface | Next.js, React 19, Tailwind v4, Radix, next-intl |
| Video | Remotion 4.x, ffmpeg |
| Data and queue | Postgres, Drizzle, pg-boss (no Redis), job status to the UI over SSE with polling fallback |
| Storage and rendering | S3 with CloudFront, Remotion Lambda |
| Auth and billing | Better Auth, Paddle or Lemon Squeezy |
| Email, analytics, errors | Resend and React Email, PostHog, Sentry |
| Models | Claude through the Anthropic SDK (tool use for structured output, prompt caching), ElevenLabs for voice and transcription, AWS Rekognition for faces |
| Quality | Biome, Vitest, Playwright for the main path, GitHub Actions |
| Hosting | Railway for web, worker and Postgres; AWS only for Lambda, S3 and CloudFront |

Remotion 4.x is free for companies of up to three people and its terms change in 5.0, so recheck the license on upgrade. Frame descriptions run on Claude Sonnet 5.5 and the director on Claude Opus 5.5 until Opus and Sonnet are compared on the vocabulary base; cheap edits go to a Haiku-class model. The reasons are in the [decision log](/product/decisions).
