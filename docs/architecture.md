# Architecture

Summary of sections 9 and 10 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

## One app, two entry points

Next.js serves the interface and the API. The worker is a second entry point into the same code and runs the pipeline. The code that knows about videos (schema, vocabulary, operations, QA) lives in one folder and runs in three places: the browser preview, the build step in the worker and the render on Lambda. There is no monorepo until one is needed.

## Folders

This is the target layout. Now there are `app/`, `features/`, `ui/`, `lib/` and `messages/` from the first slice of the application, next to `video/`, `worker/` and `cli/` from stage 0. `drizzle/` holds the database migrations and `e2e/` the Playwright test. Tests sit in a `tests/` folder next to the module they cover.

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

Slices in `features/`: auth, brand, library, generation, editing, rendering, review, billing, account, admin, landing, emails. Built so far:

| Slice | Public entry gives | Holds |
| --- | --- | --- |
| `auth` | `auth`, `SignInScreen`, `getUser`, `requireUser`, `SessionUser`, `signInMessage`, `SignInMessage` | Better Auth setup, the route rules, the Sign in and Check your inbox screens |
| `account` | the Account screen parts and their actions | profile, sign out, account deletion |
| `emails` | `sendSignInLinkEmail` | the sign-in email, built with React Email |
| `generation` | `HomeHeader` | the header of Home; the prompt arrives in the next slice |
| `landing` | `ExampleFrames` | the example frames shown next to sign-in |

Inside `app/`, `(public)` holds the pages anyone can open (Sign in) and `(app)` the pages that need a session (Home, Account, with the app bar). `api/auth/[...all]` is Better Auth's route handler. The 404 and error pages sit at the root.

`ui/` is the design system: `theme.css` generates the theme from the tokens in `docs/design/tokens.css`, and only the token steps are defined, so a raw color or size does not compile. Radix comes through the `radix-ui` package and the icons are Lucide at stroke 1.8. In `lib/`: `appEnv.ts` (the app's environment, checked with Zod), `db/` (client, schema, test database), `email/` (the SMTP mailer and the template renderer) and `i18n/` (next-intl with one locale and typed keys over `messages/en.json`). Interface strings come only from `messages/`.

## Import rules

- A slice never imports another slice's internals, only its public entry.
- A screen is assembled from slices in `app/`.
- `src/proxy.ts` imports the auth slice's `routes.ts` directly, not its `index.ts`, because the index loads `auth` and the database pool.
- Everything about the video lives in `video/` and knows nothing about the database or users.

## Sign-in

Sign-in runs on Better Auth, on top of Drizzle and Postgres. There are two ways in:

- **Email link.** The person enters an email and gets a link that is valid for 10 minutes and works once; the token is stored hashed. The email goes through the SMTP mailer: Mailpit locally, Resend's SMTP in production. A request for a link is limited to 5 per minute, and opening a link has its own limit of 30 per minute per IP, so an office behind one address is not locked out. The limiter runs in every environment and keeps its counters in the database.
- **Google.** Wired up, and it stays off until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Google's tokens are encrypted at rest.

A session lasts 30 days and its database row is refreshed daily, but the cookie is only written by the two server actions (`nextCookies` cannot set cookies while a Server Component renders), so the cookie lasts 30 days from sign-in. Better Auth's origin and callback checks are forced on in every environment, tests included. Ids are uuids made by the database.

The proxy (`src/proxy.ts`) is an optimistic gate: it only looks for the session cookie and sends a person without one to Sign in. It does not send a person with one away from Sign in, by design: only the Sign in page does that, after `getUser()` confirms a live session, so a stale cookie cannot cause a redirect loop. The cookie alone does not prove a session is valid. Every page and server action that shows or changes a person's data calls `requireUser()` itself. Cache Components are off, so signed-in pages render on every request.

Deleting an account needs a fresh session. If the session is older than a day, the person is asked to sign in again first. Sign-in requests go through `authClient.signIn.magicLink`, never through a server action that calls `auth.api`, because that path skips the rate limiter and the callback check.

## Database

Drizzle 0.45 on `pg`, with the schema in `src/lib/db/schema/`. Migrations are generated with `pnpm db:generate`, live in `drizzle/` and are applied with `pnpm db:migrate`. Ids are uuids that Postgres generates. In development the database is a Postgres on Railway reached over its public proxy; the connection uses TLS without certificate checks there and none for local hosts. Tests do not touch Railway: `createTestDb()` starts an in-memory PGlite and runs the real migrations on it.

Before deploying, check what Railway forwards: whether it overwrites or appends `X-Forwarded-For`, and whether it sends `X-Real-IP`. Better Auth 1.7.18 trusts a single-value `X-Forwarded-For` as is, resolves a multi-value one to no IP, and in production puts every request without an IP into one shared bucket (`no-trusted-ip|<path>`). Then set `advanced.ipAddress.ipAddressHeaders` or `trustedProxies` to match, and add a test that two clients get separate limits.

## Stack

| Area | Choice |
| --- | --- |
| Language and runtime | TypeScript everywhere, Node 22, pnpm |
| Interface | Next.js 16, React 19, Tailwind v4, Radix, next-intl |
| Video | Remotion 4.x, ffmpeg |
| Data and queue | Postgres, Drizzle, pg-boss (no Redis), job status to the UI over SSE with polling fallback |
| Storage and rendering | S3 with CloudFront, Remotion Lambda |
| Auth and billing | Better Auth, Paddle or Lemon Squeezy |
| Email, analytics, errors | Resend and React Email, PostHog, Sentry |
| Models | Claude through the Anthropic SDK (tool use for structured output, prompt caching), ElevenLabs for voice and transcription, AWS Rekognition for faces |
| Quality | Biome, Vitest, Playwright for the main path, GitHub Actions |
| Hosting | Railway for web, worker and Postgres; AWS only for Lambda, S3 and CloudFront |

Versions the application runs on:

| Package | Version |
| --- | --- |
| next | 16.4.5 |
| react, react-dom | 19.3.1 |
| tailwindcss | 4.3.3 |
| radix-ui | 1.8.1 |
| lucide-react | 1.61.0 |
| next-intl | 4.14.9 |
| better-auth | 1.7.18 |
| drizzle-orm, drizzle-kit | 0.45.4, 0.31.11 |
| pg | 8.23.1 |
| nodemailer, react-email | 10.2.1, 6.11.3 |
| @electric-sql/pglite | 0.5.15 |
| @playwright/test | 1.64.1 |

Dependencies are pinned exactly. Remotion 4.x is free for companies of up to three people and its terms change in 5.0, so recheck the license on upgrade. Frame descriptions run on Claude Sonnet 5.5 and the director on Claude Opus 5.5 until Opus and Sonnet are compared on the vocabulary base; cheap edits go to a Haiku-class model. The reasons are in the [decision log](/product/decisions).
