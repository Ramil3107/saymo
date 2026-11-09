# App Slice 1: Foundation and Sign-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js application in this repository where a person signs in with an email link or Google, lands on Home and manages the account, built on the design system and a migrated Postgres database.

**Architecture:** Next.js 16 App Router in `src/app` assembles screens from vertical slices in `src/features` (`auth`, `account`, `emails`, `generation`, `landing`). `src/ui` is the design system built from `docs/design/tokens.css`, and `src/lib` holds thin infrastructure (app env, db, email, i18n). Better Auth runs sign-in on Drizzle and Postgres (Railway in development). Tests run the real migrations on PGlite. The engine in `src/video` and the pipeline in `src/worker` are not touched.

**Tech Stack:** next 16.4.5, react 19.3.1 (already in the repo), tailwindcss and @tailwindcss/postcss 4.3.3, radix-ui 1.8.1, lucide-react 1.61.0, next-intl 4.14.9, better-auth 1.7.18, drizzle-orm 0.45.4, drizzle-kit 0.31.11, pg 8.23.1 with @types/pg 8.23.1, @electric-sql/pglite 0.5.15, nodemailer 10.2.1, react-email 6.11.3, concurrently 10.0.6, @playwright/test 1.64.1. Mailpit from Homebrew catches email locally.

**Spec:** `docs/superpowers/specs/2026-10-28-saymo-v1-design.md` (sections 4.1, 4.6, 4.9, 9, 10, 11); `docs/design/foundations.md`, `components.md`, `screens.md` (screens 1.2, 1.3, 2.1, 5.3) and the PNGs in `docs/design/screens/png/`; the decision log entries of 2026-11-09.

## Roadmap

This plan is slice 1. Each later slice gets its own plan when its turn comes.

1. Foundation and sign-in (this plan).
2. Main path on the mock engine: the Home prompt, generation jobs on pg-boss with a worker, Generating with the plan card and questions, Generation failed, Video and edits, Editor, My videos.
3. Brand, Download, Send for review and the review link, the rest of Account.
4. Plans and limits: Plans, Limit reached, a mock checkout, Welcome to Pro, cancellation.
5. Landing, emails for every flow, admin, legal pages, hardening (CSP).

## Global Constraints

- The code rules and the style in `CLAUDE.md` hold for every file: the reading order, functions of about 30 lines at most, no `as` and no `!`, Zod at every boundary, tests in a `tests/` folder next to the module, Biome line width 110.
- Every interface string comes from `messages/en.json` through next-intl, emails included. No literal UI text in components.
- Styles come only from the theme in `src/ui/theme.css`. Outside `src/ui/` there are no raw colors, sizes, shadows or arbitrary Tailwind values (`[...]`).
- The interface is in English. The product name is "Saymo".
- Every server action, route handler and page that shows a person's data checks the session itself. The proxy only redirects.
- No `use cache` and no `cacheComponents`: signed-in pages render on every request.
- Every command starts with `source ~/.nvm/nvm.sh && nvm use && pnpm …`. One test file: `pnpm test <path>`.
- Do not change `src/video`, `src/worker` or `src/cli`.
- Dependencies are pinned exactly (`.npmrc` has save-exact). Use the versions above.
- Touch targets are at least 44 px. Keyboard focus is a 2 px accent outline with a 2 px offset. On hover, a background goes one step lighter on the surface scale; filled accent and white buttons use `hover:brightness-110`.
- Phone: 16 px side padding, columns stack. Sign in, Check your inbox, Home and Account work at 375 px wide.
- Before each commit run `pnpm check`, `pnpm typecheck` and `pnpm test`, and the project's `review` skill. Commit messages are small and meaningful and end with the `Co-Authored-By` line.

## Review Focus

1. A sign-in link opened twice or after 10 minutes lands on the sign-in page with "That link has expired or was already used. Get a new one below.", never on an error page. Test in Task 5.
2. A `callbackURL` that points to another site is refused, so sign-in always lands on a Saymo path. Test in Task 5.
3. A sixth "Email me a link" or "Resend link" within a minute gets "Too many tries. Wait a minute and try again." and sends nothing. Test in Task 5, message in Task 7.
4. A signed-out visit to `/home` or `/account` goes to `/sign-in`. A stale cookie without a live session ends on `/sign-in` without a redirect loop. Test in Task 6.
5. Deleting the account removes the person, their sessions and their sign-in accounts, and the old cookie no longer signs anyone in. Test in Task 8.

## File Structure

| Path | Responsibility |
| --- | --- |
| `next.config.ts`, `postcss.config.mjs` | Next.js with the next-intl plugin and security headers; Tailwind through PostCSS |
| `drizzle.config.ts`, `drizzle/` | drizzle-kit settings; generated SQL migrations, committed |
| `playwright.config.ts`, `e2e/signIn.spec.ts` | the end-to-end sign-in test |
| `messages/en.json` | every interface and email string |
| `src/app/layout.tsx`, `globals.css` | root layout: fonts, theme, intl provider, icon stroke |
| `src/app/page.tsx` | `/` sends a person to Home or Sign in, until the landing exists |
| `src/app/(public)/layout.tsx`, `sign-in/page.tsx` | public bar; screens 1.2 and 1.3 |
| `src/app/(app)/layout.tsx`, `home/page.tsx`, `account/page.tsx` | app bar; screens 2.1 (header only) and 5.3 (profile, delete) |
| `src/app/api/auth/[...all]/route.ts` | Better Auth endpoints |
| `src/app/not-found.tsx`, `src/app/error.tsx` | 404 and the error boundary |
| `src/proxy.ts` | optimistic redirect of signed-out people |
| `src/ui/theme.css`, `fonts.ts` | design tokens as the Tailwind theme; Onest and JetBrains Mono from `public/fonts` |
| `src/ui/*.tsx` | Button, ButtonLink, IconButton, TextField, Card, Sticker, Logo, Divider, ConfirmDialog, AppBar, PublicBar, Avatar, Notice |
| `src/lib/appEnv.ts` | the web app's environment, parsed with Zod |
| `src/lib/db/` | `ssl.ts`, `client.ts` (pool and Drizzle), `schema/` (tables), `testDb.ts` (PGlite with the migrations) |
| `src/lib/email/` | `render.ts` (React Email to html and text), `mailer.ts` (SMTP through nodemailer) |
| `src/lib/i18n/` | `request.ts` (next-intl config), `types.ts` (typed message keys) |
| `src/features/auth/` | `createAuth.ts` (Better Auth factory), `auth.ts` (the app's instance), `client.ts`, `session.ts`, `routes.ts`, `signInErrors.ts`, `testing.ts`, sign-in components, `index.ts` |
| `src/features/emails/` | `SignInLinkEmail.tsx`, `index.ts` with `sendSignInLinkEmail` |
| `src/features/account/` | profile card, delete account card and dialog, `actions.ts`, `queries.ts`, `index.ts` |
| `src/features/generation/` | `HomeHeader.tsx` for now, `index.ts` |
| `src/features/landing/` | `ExampleFrames.tsx` (the decorative frames on Sign in), `index.ts` |

Slices import each other only through `index.ts`. Inside a slice, files import each other directly.

---

### Task 1: Next.js app on the design tokens

**Files:**
- Modify: `package.json`, `tsconfig.json`, `.gitignore`, `vitest.config.ts`, `pnpm-workspace.yaml` (only if a dependency needs its build script)
- Create: `next.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, `src/ui/theme.css`, `src/ui/fonts.ts`, `src/lib/i18n/request.ts`, `src/lib/i18n/types.ts`, `messages/en.json`, `src/app/layout.tsx`, `src/app/page.tsx` (temporary: the logo, replaced in Task 6)

**Interfaces:**
- Produces: Tailwind classes from the theme below; `fonts` in `src/ui/fonts.ts` exporting `fontVariables: string` (all four `.variable` class names joined) for `<html>`; next-intl configured with typed keys; `@/` resolving to `src/` in Next, tsc and Vitest.

- [ ] **Step 1: Install**

`pnpm add next@16.4.5 next-intl@4.14.9 radix-ui@1.8.1 lucide-react@1.61.0` and `pnpm add -D tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3`. If pnpm reports ignored build scripts, allow only the ones the app needs to start (`@parcel/watcher`, `@swc/core`, `sharp` if listed) in `pnpm-workspace.yaml` under `allowBuilds`, and leave the rest `false`.

- [ ] **Step 2: Scripts and config**

Scripts: `"dev": "concurrently -k -n web,mail \"next dev\" \"mailpit --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025\""` arrives in Task 4; for now `"dev": "next dev"`, plus `"build": "next build"`, `"start": "next start"`, `"typecheck": "next typegen && tsc --noEmit"`.

`tsconfig.json`: add `"baseUrl": "."` only if `paths` needs it, `"paths": { "@/*": ["./src/*"] }`, and add `"next-env.d.ts"`, `".next/types/**/*.ts"`, `"next.config.ts"`, `"drizzle.config.ts"`, `"playwright.config.ts"`, `"e2e"` to `include`. The first `next build` rewrites tsconfig (adds lib, allowJs, noEmit, incremental, isolatedModules, the `next` plugin): keep its additions, keep `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax`, and make sure `next-env.d.ts` stays in `include` (TS 7 rejects `import "./globals.css"` without it).

`.gitignore`: add `next-env.d.ts`, `*.tsbuildinfo`, `/test-results/`, `/playwright-report/`.

`vitest.config.ts`: add `resolve.alias` `{ "@": <absolute path of ./src> }` built with `fileURLToPath(new URL("./src", import.meta.url))`.

`next.config.ts`: wrap the config with `createNextIntlPlugin("./src/lib/i18n/request.ts")`; `reactStrictMode: true`; `poweredByHeader: false`; `headers()` returning, for `source: "/:path*"`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Strict-Transport-Security: max-age=63072000; includeSubDomains` only when `NODE_ENV === "production"`.

`postcss.config.mjs`: `export default { plugins: { "@tailwindcss/postcss": {} } };`

- [ ] **Step 3: The theme**

`src/app/globals.css` is `@import "tailwindcss";`, `@import "../ui/theme.css";` and a small `@layer base`: `html { color-scheme: dark; }`, `body` on `ink` with `white` text in `font-sans` and `-webkit-font-smoothing: antialiased`, and `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`.

`src/ui/theme.css` holds exactly these values from `docs/design/tokens.css`. The text colors are renamed so the classes read well: `text` → `white`, `text-muted` → `muted`, `text-faint` → `faint`. The demo brand colors exist only for the example frames inside fake videos.

```css
@theme {
  --color-*: initial;
  --color-ink: #08080b;
  --color-stage: #0f0f13;
  --color-surface: #141418;
  --color-raised: #1d1d22;
  --color-selected: #26262c;
  --color-line: #2c2c33;
  --color-line-strong: #3a3a44;
  --color-line-input: #4a4a55;
  --color-white: #ffffff;
  --color-muted: #a3a3ad;
  --color-faint: #8a8a94;
  --color-accent: #ff4a1c;
  --color-scrim: rgb(8 8 11 / 0.76);
  --color-demo-blue: #2d4bff;
  --color-demo-yellow: #ffd23f;
  --color-demo-paper: #f3f1ec;
  --color-demo-forest: #0e3b2e;
  --color-demo-lime: #b8f35a;
  --color-demo-violet: #5b34d6;
  --color-demo-peach: #ff8a5b;

  --text-*: initial;
  --text-hero: clamp(44px, 7.5vw, 96px);
  --text-hero--line-height: 0.98;
  --text-hero--letter-spacing: -0.04em;
  --text-hero--font-weight: 800;
  --text-display: clamp(36px, 5.4vw, 68px);
  --text-display--line-height: 1.02;
  --text-display--letter-spacing: -0.035em;
  --text-display--font-weight: 800;
  --text-title: clamp(32px, 4.4vw, 52px);
  --text-title--line-height: 1.04;
  --text-title--letter-spacing: -0.035em;
  --text-title--font-weight: 800;
  --text-section: clamp(32px, 4vw, 44px);
  --text-section--line-height: 1.05;
  --text-section--letter-spacing: -0.03em;
  --text-section--font-weight: 800;
  --text-heading: 26px;
  --text-heading--line-height: 1.2;
  --text-heading--letter-spacing: -0.02em;
  --text-heading--font-weight: 700;
  --text-card-title: 22px;
  --text-card-title--line-height: 1.2;
  --text-card-title--letter-spacing: -0.02em;
  --text-card-title--font-weight: 700;
  --text-bar-title: 18px;
  --text-bar-title--line-height: 1.3;
  --text-bar-title--letter-spacing: -0.01em;
  --text-bar-title--font-weight: 700;
  --text-lead: 18px;
  --text-lead--line-height: 1.45;
  --text-body: 16px;
  --text-body--line-height: 1.45;
  --text-dense: 15px;
  --text-dense--line-height: 1.45;
  --text-small: 14px;
  --text-small--line-height: 1.45;
  --text-label: 13px;
  --text-label--line-height: 1.4;
  --text-label--font-weight: 500;
  --text-mono: 13px;
  --text-meta: 12px;

  --radius-*: initial;
  --radius-pill: 999px;
  --radius-panel: 28px;
  --radius-frame: 24px;
  --radius-row: 18px;
  --radius-input: 16px;
  --radius-clip: 14px;
  --radius-small: 12px;

  --spacing: initial;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-14: 14px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-44: 44px;

  --container-*: initial;
  --container-task: 880px;
  --container-wide: 1216px;
  --container-modal: 500px;

  --shadow-*: initial;
  --shadow-float: 0 24px 60px rgb(0 0 0 / 0.6);
}

@theme inline {
  --font-sans: var(--font-onest-latin), var(--font-onest-cyrillic), "Segoe UI", system-ui, sans-serif;
  --font-mono: var(--font-mono-latin), var(--font-mono-cyrillic), "Courier New", monospace;
}
```

With `--spacing: initial` only the listed steps exist, so `p-16` and `gap-14` work and `p-15` does not. Sizes that only a component needs (52 px buttons, a 22 px logo dot) are arbitrary values inside `src/ui/` components, which the rule allows.

- [ ] **Step 4: Fonts**

`src/ui/fonts.ts` uses `next/font/local` once per file and subset, with literal options (`next/font` rejects named constants): Onest `latin-normal.woff2` with `weight: "100 900"`, `variable: "--font-onest-latin"`, `adjustFontFallback: false` and the Latin `unicode-range` through `declarations`; Onest `cyrillic-normal.woff2` with `variable: "--font-onest-cyrillic"`, `preload: false` and the Cyrillic range; the same pair for JetBrains Mono (`src` an array of the normal and italic files, `weight: "100 800"`, variables `--font-mono-latin` and `--font-mono-cyrillic`). Take the two `unicode-range` values from `public/fonts/manifest.json`. `adjustFontFallback: false` keeps Arial from drawing Cyrillic before the Cyrillic file is reached.

- [ ] **Step 5: next-intl and the root layout**

`src/lib/i18n/request.ts`: `getRequestConfig(async () => ({ locale: "en", messages: (await import("../../../messages/en.json")).default }))`. `src/lib/i18n/types.ts`: `declare module "next-intl" { interface AppConfig { Locale: "en"; Messages: typeof messages } }` with `import type messages from "../../../messages/en.json"`.

`messages/en.json` starts with `{ "Brand": { "name": "Saymo" } }` and grows in later tasks.

`src/app/layout.tsx`: `<html lang="en" className={fontVariables}>`, `<body>` with `<NextIntlClientProvider>` around `<LucideProvider strokeWidth={1.8}>` (if 1.61.0 has no `LucideProvider`, put `.lucide { stroke-width: 1.8; }` in the base layer instead) around `children`. `metadata`: title template `"%s · Saymo"`, default `"Saymo"`, description from messages through `getTranslations` in `generateMetadata`.

`src/app/page.tsx` (temporary): the Saymo name in `text-display` on the ink background, from `Brand.name`.

- [ ] **Step 6: Verify**

Run: `pnpm build`. Expected: compiled with no type errors (TypeScript 7 runs through the project's own `tsc`).
Run: `pnpm dev`, open http://localhost:3000 in the browser pane. Expected: "Saymo" in Onest 800 on `#08080b`. In devtools the `html` element carries the four font variables.
Run: `pnpm check && pnpm typecheck && pnpm test`. Expected: all green, the existing 485 tests still pass.

- [ ] **Step 7: Commit**

`git add` the files above and `pnpm-lock.yaml`; `git commit -m "feat: a Next.js app on the design tokens"`.

---

### Task 2: Design system primitives

**Files:**
- Create in `src/ui/`: `Button.tsx`, `IconButton.tsx`, `TextField.tsx`, `Card.tsx`, `Sticker.tsx`, `Logo.tsx`, `Divider.tsx`, `ConfirmDialog.tsx`, `AppBar.tsx`, `PublicBar.tsx`, `Avatar.tsx`, `Notice.tsx`, `PageWidth.tsx`
- Modify: `src/app/page.tsx` (the temporary page shows the `Logo` with `Brand.name`)

**Interfaces:**
- Produces:
  - `Button(props: { variant: "primary" | "white" | "secondary" | "outline" | "suggestion"; size?: "large" | "regular"; icon?: ReactNode; iconSide?: "start" | "end"; busy?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>)` and `ButtonLink(props: { variant; size?; icon?; iconSide?; href: string; children })` rendering Next `Link` with the same classes, from `Button.tsx`.
  - `IconButton(props: { label: string; icon: ReactNode; href?: string } & ButtonHTMLAttributes<HTMLButtonElement>)`. `label` becomes `aria-label`; with `href` it renders a `Link`.
  - `TextField(props: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>)`, wiring `id`, `aria-invalid` and `aria-describedby` to the error line.
  - `Card(props: { label?: string; children; className?: string })`, `Sticker(props: { children; size?: "regular" | "large" })`, `Logo(props: { href: string; name: string })`, `Divider(props: { label: string })`, `Avatar(props: { name: string; image: string | null; size: "large" | "small" })`, `Notice(props: { children; tone: "info" | "problem" })`, `PageWidth(props: { width: "task" | "wide"; children })`.
  - `ConfirmDialog(props: { trigger: ReactNode; title: string; description: string; confirmLabel: string; cancelLabel: string; onConfirm: () => Promise<void>; children?: ReactNode })`, a client component on Radix `Dialog` from `radix-ui`; `children` is extra content under the description (a message after a failed confirm).
  - `AppBar(props: { logo: ReactNode; children: ReactNode })` and `PublicBar(props: { logo: ReactNode; children?: ReactNode })`.

- [ ] **Step 1: Build the primitives to `docs/design/components.md`**

The exact measures live in "Buttons", "Input fields", "Feedback", "Containers" and "Top bars" of `components.md`. The ones that decide the look:
  - Buttons: all pills. Primary large is 52 high, `0 26` padding, accent background, ink text 16/700, an 18 icon on the right. Primary regular is 44 high, `0 20`, 15/700. White is 52, white background, ink text 16/700. Secondary is 44, `0 18`, `raised` background, `line` border, text 15/400, a 17 icon on the left. Outline is 44, `0 16`, transparent, `line-strong` border, text 14. Suggestion is 44, `0 16`, `surface`, `line` border, text 14. The icon gap is 8, and 10 in large buttons. A `busy` button shows a spinner (lucide `LoaderCircle` with `animate-spin`) in place of its icon and sets `aria-busy` and `disabled`.
  - IconButton: a 44 circle, `line` border, `surface` background, an 18 icon.
  - TextField: label 13/500 `muted` with gap 8, input 52 high, padding `0 18`, radius 16, `line-input` border, `stage` background, text 16, placeholder `faint`. The error line is 13 in `white` with a 16 lucide `CircleAlert`. Errors never use the accent.
  - Card: `surface`, `line` border, radius 28, padding 24; the optional label sits on top in 13/500 `muted`.
  - Sticker: a white pill with ink text 13/800, uppercase, `tracking` +4%, padding `6 14`, `box-shadow: 0 0 0 3px ink, 0 0 0 6px white`, rotated −3°. The large one is text 32 with 4 px outlines.
  - Logo: a 22 accent circle and the name in 17/700, linking to `href`.
  - Divider: two `line` rules with the label in 13 `muted` between them.
  - ConfirmDialog: width up to 500, `surface`, `line` border, radius 28, padding 28, `shadow-float`, gap 22, the scrim `bg-scrim`; heading 26/700 with the description in 15 `muted`; the cancel button is secondary and the confirm button is primary.
  - AppBar: padding 20 on top and bottom, 32 on the sides (16 below 640 px), the logo left and `children` right with gap 8. PublicBar: the same, with an optional right slot.
  - Avatar: large is 64, small is 36, a `raised` circle with the first letter of the name in 600, or the image when there is one.
  - Notice: a `raised` row, radius 18, padding `12 14`, text 14; `problem` adds a 16 `CircleAlert`, `info` a 16 `Info`.
  - PageWidth: centered, max width `task` (880) or `wide` (1216), side padding 32 (16 on phones).

- [ ] **Step 2: Verify**

Run: `pnpm check && pnpm typecheck && pnpm build`. Expected: clean. Run `pnpm dev` and open http://localhost:3000: the logo matches the top left of `1-2-sign-in.png`. The other primitives are checked by eye on the screens of Tasks 7 and 8, where they first appear with real copy.

- [ ] **Step 3: Commit**

`git commit -m "feat: design system primitives on the tokens"`

---

### Task 3: App environment and the database client

**Files:**
- Create: `src/lib/appEnv.ts`, `src/lib/tests/appEnv.test.ts`, `src/lib/db/ssl.ts`, `src/lib/db/tests/ssl.test.ts`, `src/lib/db/client.ts`, `src/lib/db/schema/index.ts` (empty export list for now), `drizzle.config.ts`
- Modify: `package.json` (deps and the `db:generate`, `db:migrate` scripts), `.env.example` (the new variables with empty or default values), the worktree's `.env` (local values, never committed)

**Interfaces:**
- Produces:
  - `AppEnvSchema`, `type AppEnv`, `loadAppEnv(source?: Record<string, string | undefined>): AppEnv`, `appEnv(): AppEnv` (parsed once and cached), `googleSignIn(env: AppEnv): { clientId: string; clientSecret: string } | undefined`.
  - `sslFor(databaseUrl: string): false | { rejectUnauthorized: false }`.
  - `db` (Drizzle on a `pg` Pool), `type Schema = typeof schema`, `type Database = NodePgDatabase<Schema> | PgliteDatabase<Schema>`.

- [ ] **Step 1: Install**

`pnpm add drizzle-orm@0.45.4 pg@8.23.1` and `pnpm add -D drizzle-kit@0.31.11 @types/pg@8.23.1 @electric-sql/pglite@0.5.15`. Scripts: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`.

- [ ] **Step 2: Write the failing tests**

```ts
// src/lib/tests/appEnv.test.ts
const complete = {
  DATABASE_URL: "postgresql://saymo:secret@localhost:5432/saymo",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

test("a complete environment parses", () => {
  expect(loadAppEnv(complete).BETTER_AUTH_URL).toBe("http://localhost:3000");
});
test("a short auth secret is rejected", () => {
  expect(() => loadAppEnv({ ...complete, BETTER_AUTH_SECRET: "short" })).toThrow("BETTER_AUTH_SECRET");
});
test("email goes to the local Mailpit by default", () => {
  const env = loadAppEnv(complete);
  expect(env.SMTP_URL).toBe("smtp://127.0.0.1:1025");
  expect(env.EMAIL_FROM).toBe("Saymo <hello@saymo.local>");
});
test("Google sign-in is off when its keys are empty", () => {
  expect(googleSignIn(loadAppEnv({ ...complete, GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "" }))).toBeUndefined();
});
test("Google sign-in needs both the id and the secret", () => {
  expect(() => loadAppEnv({ ...complete, GOOGLE_CLIENT_ID: "id" })).toThrow("GOOGLE_CLIENT_SECRET");
});
test("Google sign-in is on when both keys are set", () => {
  const env = loadAppEnv({ ...complete, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });
  expect(googleSignIn(env)).toEqual({ clientId: "id", clientSecret: "secret" });
});

// src/lib/db/tests/ssl.test.ts
test("a local database is reached without TLS", () => {
  expect(sslFor("postgresql://u:p@localhost:5432/db")).toBe(false);
  expect(sslFor("postgresql://u:p@127.0.0.1:5432/db")).toBe(false);
});
test("Railway's private network is reached without TLS", () => {
  expect(sslFor("postgresql://u:p@postgres.railway.internal:5432/railway")).toBe(false);
});
test("a public host is reached over TLS that accepts Railway's self-signed certificate", () => {
  expect(sslFor("postgresql://u:p@shortline.proxy.rlwy.net:13046/railway")).toEqual({ rejectUnauthorized: false });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm test src/lib/tests/appEnv.test.ts` and `pnpm test src/lib/db/tests/ssl.test.ts`. Expected: FAIL, modules not found.

- [ ] **Step 4: Implement**

`appEnv.ts` reuses the `emptyAsMissing` idea from `src/lib/env.ts` (copy the three-line helper; it is the second use). Fields: `DATABASE_URL` (url), `BETTER_AUTH_SECRET` (string, min 32), `BETTER_AUTH_URL` (url), `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional, empty is missing, a `superRefine` adds an issue on the missing one when only one is set), `SMTP_URL` (url, default `smtp://127.0.0.1:1025`), `EMAIL_FROM` (string, default `Saymo <hello@saymo.local>`).

`ssl.ts`: parse with `new URL`; no TLS for `localhost`, `127.0.0.1` and hosts ending in `.railway.internal`; otherwise `{ rejectUnauthorized: false }` with a one-line comment that Railway's certificate is self-signed.

`client.ts`: one `Pool` (`connectionString`, `ssl: sslFor(url)`, `max: 10`), kept on `globalThis` in development so hot reloads reuse it; `export const db = drizzle({ client: pool, schema, casing: "snake_case" })`.

`drizzle.config.ts`: `process.loadEnvFile()` when `.env` exists; `defineConfig({ dialect: "postgresql", schema: "./src/lib/db/schema/index.ts", out: "./drizzle", casing: "snake_case", dbCredentials: { url, ssl: sslFor(url) } })`. If drizzle-kit 0.31 does not accept `ssl` next to `url`, pass the URL's parts (`host`, `port`, `user`, `password`, `database`, `ssl`) instead.

`.env` (local, not committed): add `BETTER_AUTH_SECRET` from `openssl rand -base64 32` and `BETTER_AUTH_URL=http://localhost:3000`. `DATABASE_URL` is already there (Railway's public URL).

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/lib/tests/appEnv.test.ts src/lib/db/tests/ssl.test.ts`. Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat: the app's environment and database client"`

---

### Task 4: Email through React Email and SMTP

**Files:**
- Create: `src/lib/email/render.ts`, `src/lib/email/mailer.ts`, `src/lib/email/tests/mailer.test.ts`, `src/features/emails/SignInLinkEmail.tsx`, `src/features/emails/index.ts`, `src/features/emails/tests/signInLink.test.ts`
- Modify: `package.json` (deps; the `dev` script), `messages/en.json` (`Emails.SignInLink`)

**Interfaces:**
- Consumes: `appEnv()` (`SMTP_URL`, `EMAIL_FROM`).
- Produces:
  - `type Email = { to: string; subject: string; html: string; text: string }`, `type Mailer = { send(email: Email): Promise<void> }`, `createMailer(transport: Transporter, from: string): Mailer`, `mailer(): Mailer` (built once from `appEnv()` with `nodemailer.createTransport(SMTP_URL)`).
  - `renderEmail(element: ReactElement): Promise<{ html: string; text: string }>`.
  - `sendSignInLinkEmail(mailer: Mailer, message: { to: string; url: string }): Promise<void>` from `@/features/emails`.

- [ ] **Step 1: Install and run Mailpit**

`pnpm add nodemailer@10.2.1 react-email@6.11.3` and `pnpm add -D concurrently@10.0.6`. `brew install mailpit` (only on a machine without it). The `dev` script becomes `concurrently -k -n web,mail "next dev" "mailpit --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025"`: Mailpit listens on localhost only and runs only while `pnpm dev` runs.

- [ ] **Step 2: Copy**

```json
"Emails": {
  "SignInLink": {
    "subject": "Your sign-in link to Saymo",
    "preview": "Tap to sign in to Saymo.",
    "title": "Your sign-in link",
    "body": "Tap below to sign in. The link works once and expires in 10 minutes.",
    "button": "Sign in",
    "fallback": "Or paste this link into your browser:",
    "ignore": "Didn't ask for this? Ignore this email and nothing happens."
  }
}
```

- [ ] **Step 3: Write the failing tests**

```ts
// src/features/emails/tests/signInLink.test.ts
const url = "http://localhost:3000/api/auth/magic-link/verify?token=abc&callbackURL=%2Fhome";

test("the sign-in email carries the link in its html and its text", async () => {
  const sent = captureMailer();
  await sendSignInLinkEmail(sent.mailer, { to: "ana@company.com", url });
  expect(sent.emails).toHaveLength(1);
  expect(sent.emails[0]?.to).toBe("ana@company.com");
  expect(sent.emails[0]?.subject).toBe("Your sign-in link to Saymo");
  expect(sent.emails[0]?.html).toContain("token=abc&amp;callbackURL=%2Fhome");
  expect(sent.emails[0]?.text).toContain(url);
});

// src/lib/email/tests/mailer.test.ts
test("the mailer sends from the configured sender", async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const sendMail = vi.spyOn(transport, "sendMail");
  await createMailer(transport, "Saymo <hello@saymo.local>").send({ to: "a@b.co", subject: "S", html: "<p>H</p>", text: "H" });
  expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: "Saymo <hello@saymo.local>", to: "a@b.co", subject: "S" }));
});
```

`captureMailer()` is a small helper at the top of the test file returning `{ mailer, emails }`.

- [ ] **Step 4: Run them to see them fail**

Run: `pnpm test src/features/emails/tests/signInLink.test.ts src/lib/email/tests/mailer.test.ts`. Expected: FAIL.

- [ ] **Step 5: Implement**

`renderEmail` uses `render` (async) and `toPlainText` from `react-email`. `SignInLinkEmail({ url, copy })` is a React Email layout: the Saymo logo row (an accent dot and the name), the title, the body, a button with the accent background and ink text linking to `url`, the fallback line with the raw URL, and the ignore line. It takes its strings as props. `sendSignInLinkEmail` builds those strings with `createTranslator({ locale: "en", messages, namespace: "Emails.SignInLink" })` from `next-intl`, renders, and sends with the subject from the same namespace. The email's colors are literal hex inside the email component (email clients do not read the app's CSS); use the token values, and add a one-line comment saying why.

- [ ] **Step 6: Run the tests**

Run: the two test files. Expected: PASS.

- [ ] **Step 7: Commit**

`git commit -m "feat: sign-in email through React Email and SMTP, Mailpit in development"`

---

### Task 5: Better Auth on Drizzle, with the first migration

**Files:**
- Create: `src/lib/db/schema/auth.ts`, `drizzle/0000_*.sql` and `drizzle/meta/*` (generated), `src/lib/db/testDb.ts`, `src/features/auth/createAuth.ts`, `src/features/auth/auth.ts`, `src/features/auth/client.ts`, `src/features/auth/testing.ts`, `src/features/auth/tests/createAuth.test.ts`, `src/app/api/auth/[...all]/route.ts`
- Modify: `src/lib/db/schema/index.ts`, `package.json`

**Interfaces:**
- Consumes: `Database`, `Mailer`, `sendSignInLinkEmail`, `appEnv()`, `googleSignIn()`, `db`, `mailer()`.
- Produces:
  - Tables `users`, `sessions`, `accounts`, `verifications`, `rateLimits` (SQL `rate_limits`), exported from `schema/index.ts` under exactly those keys (the Drizzle adapter with `usePlural: true` looks them up by these names).
  - `createTestDb(): Promise<{ db: PgliteDatabase<Schema>; close(): Promise<void> }>` applying `drizzle/` with `migrate` from `drizzle-orm/pglite/migrator`.
  - `type AuthDeps = { db: Database; secret: string; baseURL: string; google?: { clientId: string; clientSecret: string }; sendSignInLink(to: string, url: string): Promise<void>; plugins?: BetterAuthPlugin[] }`, `createAuth(deps: AuthDeps)` returning the Better Auth instance, `type Auth = ReturnType<typeof createAuth>`.
  - `auth` (the app's instance, with `nextCookies()` as the last plugin) in `auth.ts`; `authClient` in `client.ts` (`createAuthClient({ plugins: [magicLinkClient()] })`).
  - `signInByEmail(auth: Auth, email: string, links: string[]): Promise<{ cookie: string }>` in `testing.ts`, used by tests: requests a link, opens the newest one and returns the session cookie.

- [ ] **Step 1: Install**

`pnpm add better-auth@1.7.18`.

- [ ] **Step 2: The schema**

Write `schema/auth.ts` by hand from the Better Auth 1.7 core schema, with `casing: "snake_case"` doing the column names and uuid ids generated in the database:
  - `users`: `id` uuid primary key `defaultRandom()`, `name` text not null, `email` text not null unique, `emailVerified` boolean not null default false, `image` text, `createdAt` and `updatedAt` timestamptz not null default now.
  - `sessions`: `id` uuid pk, `expiresAt` timestamptz not null, `token` text not null unique, `createdAt`, `updatedAt`, `ipAddress` text, `userAgent` text, `userId` uuid not null references `users.id` on delete cascade; index on `userId`.
  - `accounts`: `id` uuid pk, `accountId` text not null, `providerId` text not null, `userId` uuid not null references `users.id` on delete cascade, `accessToken`, `refreshToken`, `idToken` text, `accessTokenExpiresAt`, `refreshTokenExpiresAt` timestamptz, `scope`, `password` text, `createdAt`, `updatedAt`; index on `userId`.
  - `verifications`: `id` uuid pk, `identifier` text not null, `value` text not null, `expiresAt` timestamptz not null, `createdAt`, `updatedAt`; index on `identifier`.
  - `rateLimits`: `id` uuid pk, `key` text not null unique, `count` integer not null, `lastRequest` bigint (`mode: "number"`) not null.

Run: `pnpm db:generate`. Expected: `drizzle/0000_<name>.sql` creating the five tables. Read the SQL: snake_case columns, `ON DELETE cascade` on both foreign keys, the three indexes.

- [ ] **Step 3: Write the failing tests**

```ts
// src/features/auth/tests/createAuth.test.ts
const baseURL = "http://localhost:3000";
const ip = { "x-forwarded-for": "203.0.113.7" };

test("an email link signs a new person in and lands on Home", async () => {
  const { auth, links, db } = await setUp();
  const { cookie } = await signInByEmail(auth, "ana@company.com", links);
  expect(cookie).toContain("better-auth.session_token=");
  const [person] = await db.select().from(users).where(eq(users.email, "ana@company.com"));
  expect(person?.emailVerified).toBe(true);
});

test("a link works once", async () => {
  const { auth, links } = await setUp();
  await requestLink(auth, "ana@company.com");
  await open(auth, links[0]);
  const second = await open(auth, links[0]);
  expect(second.status).toBe(302);
  expect(second.headers.get("location")).toMatch(/^\/sign-in\?error=/);
});

test("a link expires after ten minutes", async () => {
  const { auth, links } = await setUp();
  await requestLink(auth, "ana@company.com");
  vi.setSystemTime(Date.now() + 11 * 60_000);
  const opened = await open(auth, links[0]);
  expect(opened.headers.get("location")).toMatch(/^\/sign-in\?error=/);
});

test("a callback to another site is refused and no email goes out", async () => {
  const { auth, links } = await setUp();
  const response = await requestLink(auth, "ana@company.com", { callbackURL: "https://evil.example/steal" });
  expect(response.status).toBe(403);
  expect(links).toHaveLength(0);
});

test("a sixth link request within a minute is refused", async () => {
  const { auth, links } = await setUp();
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await requestLink(auth, "ana@company.com")).status);
  expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
  expect(statuses[5]).toBe(429);
  expect(links).toHaveLength(5);
});
```

`setUp()` builds a fresh `createTestDb()` and `createAuth({ db, secret: "a".repeat(32), baseURL, sendSignInLink: (_to, url) => { links.push(url) } })`. `requestLink(auth, email, overrides?)` posts to `${baseURL}/api/auth/sign-in/magic-link` through `auth.handler` with `origin: baseURL`, `content-type: application/json`, the `ip` header and the body `{ email, callbackURL: "/home", newUserCallbackURL: "/home", errorCallbackURL: "/sign-in", ...overrides }`. `open(auth, url)` sends a GET for the link through `auth.handler`. Use `vi.useFakeTimers({ toFake: ["Date"] })` only in the expiry test and restore it after.

- [ ] **Step 4: Run them to see them fail**

Run: `pnpm test src/features/auth/tests/createAuth.test.ts`. Expected: FAIL, `createAuth` not found.

- [ ] **Step 5: Implement**

`createAuth(deps)`:
  - `database: drizzleAdapter(deps.db, { provider: "pg", schema, usePlural: true })`, `secret`, `baseURL`.
  - `advanced: { database: { generateId: false }, useSecureCookies: baseURL.startsWith("https://") }`: the database makes the uuid ids.
  - `session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 }` (30 days, refreshed daily; the lead's call, in the decision of Task 10).
  - `rateLimit: { enabled: true, storage: "database" }`, so it limits in development too (with `usePlural` the adapter finds `rateLimits`).
  - `socialProviders`: `{ google: { ...deps.google, prompt: "select_account" } }` only when `deps.google` is set.
  - `user: { deleteUser: { enabled: true } }`.
  - `plugins: [magicLink({ expiresIn: 600, storeToken: "hashed", sendMagicLink: ({ email, url }) => deps.sendSignInLink(email, url) }), ...(deps.plugins ?? [])]`.
  - Name the numbers as constants at the top of the file (`linkLifetimeSeconds = 600`, `sessionDays = 30`).

`auth.ts`: `createAuth({ db, secret, baseURL, google: googleSignIn(env), sendSignInLink: (to, url) => sendSignInLinkEmail(mailer(), { to, url }), plugins: [nextCookies()] })` with `env = appEnv()`.

`route.ts`: `export const { GET, POST } = toNextJsHandler(auth);`

If a test fails because the adapter wants a field the schema lacks, fix the schema (the adapter's error names the field), then `pnpm db:generate` again, deleting the first generated migration so there is one `0000` file.

- [ ] **Step 6: Run the tests**

Run: `pnpm test src/features/auth/tests/createAuth.test.ts`. Expected: PASS, five tests.

- [ ] **Step 7: Migrate the development database**

Run: `pnpm db:migrate`. Expected: the migration applies on Railway; running it again reports nothing to apply.

- [ ] **Step 8: Commit**

`git commit -m "feat: sign-in with an email link on Better Auth and Drizzle"`

---

### Task 6: Session helpers and route protection

**Files:**
- Create: `src/features/auth/session.ts`, `src/features/auth/routes.ts`, `src/features/auth/tests/routes.test.ts`, `src/features/auth/index.ts`, `src/proxy.ts`, `src/app/(app)/home/page.tsx` (a minimal page with the Home title, replaced in Task 8)
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `auth`.
- Produces:
  - `type SessionUser = { id: string; name: string; email: string; image: string | null }`.
  - `getUser(): Promise<SessionUser | null>` wrapped in React `cache`, reading `auth.api.getSession({ headers: await headers() })`.
  - `requireUser(): Promise<SessionUser>`, redirecting to `/sign-in` when there is no session.
  - `redirectFor(pathname: string, hasSessionCookie: boolean): string | null`.
  - `@/features/auth` (`index.ts`) exports `getUser`, `requireUser`, `type SessionUser`, and in Task 7 `SignInScreen`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/auth/tests/routes.test.ts
test("a signed-out visit to an app page goes to sign-in", () => {
  expect(redirectFor("/home", false)).toBe("/sign-in");
  expect(redirectFor("/account", false)).toBe("/sign-in");
  expect(redirectFor("/videos/123", false)).toBe("/sign-in");
});
test("public pages stay open without a session", () => {
  for (const path of ["/", "/sign-in", "/api/auth/magic-link/verify", "/r/7Kq2xV", "/terms", "/privacy"]) {
    expect(redirectFor(path, false)).toBeNull();
  }
});
test("a prefix only matches whole segments", () => {
  expect(redirectFor("/reports", false)).toBe("/sign-in");
});
test("a cookie lets app pages through, and sign-in is never redirected by the cookie alone", () => {
  expect(redirectFor("/home", true)).toBeNull();
  expect(redirectFor("/sign-in", true)).toBeNull();
});
```

The last case is the loop guard: a stale cookie would otherwise bounce between `/home` and `/sign-in`. The sign-in page itself sends a person with a live session to Home.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm test src/features/auth/tests/routes.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

`routes.ts`: a list of public paths (`/`, `/sign-in`, `/api/auth`, `/r`, `/terms`, `/privacy`) matched as whole segments; everything else needs a session.

`proxy.ts`: `export function proxy(request: NextRequest)` reads `getSessionCookie(request)` from `better-auth/cookies`, redirects with `NextResponse.redirect(new URL(target, request.url))` when `redirectFor` returns a path, else `NextResponse.next()`. `export const config = { matcher: ["/((?!_next/static|_next/image|fonts/|favicon.ico|.*\\..*).*)"] }`.

`src/app/page.tsx`: `redirect((await getUser()) ? "/home" : "/sign-in")` until the landing exists.

`src/app/(app)/home/page.tsx`: `await requireUser()` and the `Home.title` heading.

- [ ] **Step 4: Run the test**

Run: `pnpm test src/features/auth/tests/routes.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: signed-out people are sent to sign-in"`

---

### Task 7: Sign in and Check your inbox (screens 1.2 and 1.3)

**Files:**
- Create: `src/features/auth/signInErrors.ts`, `src/features/auth/tests/signInErrors.test.ts`, `src/features/auth/components/SignInScreen.tsx`, `SignInFlow.tsx`, `EmailForm.tsx`, `GoogleButton.tsx`, `CheckEmail.tsx`, `EmailMockup.tsx` (all in `components/`), `src/features/landing/ExampleFrames.tsx`, `src/features/landing/index.ts`, `src/app/(public)/layout.tsx`, `src/app/(public)/sign-in/page.tsx`
- Modify: `src/features/auth/index.ts`, `messages/en.json` (`SignIn`, `CheckEmail`)

**Interfaces:**
- Consumes: `authClient`, `getUser`, `googleSignIn(appEnv())`, the `src/ui` primitives.
- Produces:
  - `type SignInMessage = "linkExpired" | "googleFailed" | "accountDeleted"`, `signInMessage(params: { error?: string; deleted?: string }): SignInMessage | null`.
  - `SignInScreen(props: { googleEnabled: boolean; message: SignInMessage | null })`, a server component exported from `@/features/auth`.
  - `ExampleFrames()` from `@/features/landing`.

- [ ] **Step 1: Copy**

```json
"SignIn": {
  "sticker": "No password needed",
  "title": "Sign in and start making.",
  "lead": "Use Google or get a sign-in link by email.",
  "google": "Continue with Google",
  "or": "or",
  "emailLabel": "Work email",
  "emailPlaceholder": "you@company.com",
  "submit": "Email me a link",
  "terms": "By continuing you agree to the <terms>Terms</terms> and the <privacy>Privacy Policy</privacy>.",
  "invalidEmail": "Enter an email address like you@company.com.",
  "tooManyTries": "Too many tries. Wait a minute and try again.",
  "sendFailed": "We couldn't send the link. Try again.",
  "linkExpired": "That link has expired or was already used. Get a new one below.",
  "googleFailed": "Google sign-in didn't finish. Try again or use your email.",
  "accountDeleted": "Your account is deleted. Thanks for trying Saymo."
},
"CheckEmail": {
  "mockName": "Saymo",
  "mockTime": "now",
  "mockTitle": "Your sign-in link",
  "mockBody": "Tap below to sign in. The link works once.",
  "mockButton": "Sign in",
  "title": "Check your inbox.",
  "lead": "We sent a sign-in link to <email>{email}</email>. Open it on this device.",
  "resend": "Resend link",
  "resent": "Sent again",
  "differentEmail": "Use a different email",
  "spamHint": "Nothing there? Check spam or the Promotions tab."
}
```

- [ ] **Step 2: Write the failing test**

```ts
// src/features/auth/tests/signInErrors.test.ts
test("a bad or used link reads as expired", () => {
  expect(signInMessage({ error: "INVALID_TOKEN" })).toBe("linkExpired");
  expect(signInMessage({ error: "EXPIRED_TOKEN" })).toBe("linkExpired");
});
test("any other error from the sign-in round trip reads as a Google problem", () => {
  expect(signInMessage({ error: "access_denied" })).toBe("googleFailed");
});
test("a deleted account gets a goodbye", () => {
  expect(signInMessage({ deleted: "1" })).toBe("accountDeleted");
});
test("a plain visit shows no message", () => {
  expect(signInMessage({})).toBeNull();
});
```

- [ ] **Step 3: Run it to see it fail, implement `signInErrors.ts`, run it to see it pass**

Run: `pnpm test src/features/auth/tests/signInErrors.test.ts`. Expected: FAIL, then PASS.

- [ ] **Step 4: Build the screens**

`sign-in/page.tsx`: `if (await getUser()) redirect("/home")`; reads `searchParams` (`error`, `deleted`, validated with a Zod object of optional strings); renders `SignInScreen`. Title metadata "Sign in".

`SignInScreen` (server): the two-column layout of `1-2-sign-in.png`. Left: Sticker, `text-title` heading, `text-lead muted` line, then `SignInFlow`. Right: `ExampleFrames`, hidden below 900 px. When the flow is in its sent state the whole screen switches to the centered layout of `1-3-check-email.png`, so `SignInFlow` receives the left-column header and the frames as props and owns both layouts.

`SignInFlow` (client) holds `{ step: "form" } | { step: "sent"; email: string }`. The form step shows the `Notice` for `message` (tone `problem` for `linkExpired` and `googleFailed`, `info` for `accountDeleted`), `GoogleButton` when `googleEnabled`, `Divider` "or", and `EmailForm`. The sent step shows `CheckEmail`.

`EmailForm`: `TextField` (type email, `autoComplete="email"`, required) and a primary large full-width "Email me a link" button with `busy` while sending. On submit: `z.email()` check (show `invalidEmail` under the field), then `authClient.signIn.magicLink({ email, callbackURL: "/home", newUserCallbackURL: "/home", errorCallbackURL: "/sign-in" })`. A 429 shows `tooManyTries`, any other error `sendFailed`, success moves to the sent step. Under the button, the terms line in 13 `muted` with underlined `/terms` and `/privacy` links.

`GoogleButton`: the white large full-width button with Google's standard multicolor "G" mark (inline SVG, as Google's branding asks) and "Continue with Google"; on click `authClient.signIn.social({ provider: "google", callbackURL: "/home", errorCallbackURL: "/sign-in" })`, busy until the browser leaves.

`CheckEmail`: `EmailMockup` (the tilted white card with the logo row, "now", title, body and an accent "Sign in" pill, all from `CheckEmail.mock*`), the `text-title` "Check your inbox.", the lead with the address in white 700, a secondary "Resend link" button with a lucide `Mail` icon, and "Use a different email" as an underlined text button that goes back to the form. Resend calls the same `magicLink` request; on success the button reads "Sent again" and stays disabled for 30 seconds (a named constant); a 429 shows `tooManyTries` under the buttons. The spam hint sits under them in 13 `faint`.

`ExampleFrames`: the three tilted frames of `1-2-sign-in.png` ("Reports, now in PDF" on demo blue, "3× more signups" on demo forest with lime, "And that's when everything changed" on demo violet), drawn with the `demo-*` colors, a play button on each, rotated −6°, 2° and −3°, `shadow-float`. Their texts are part of the picture and go in messages under `Landing.frames`. Mark the group `aria-hidden`.

- [ ] **Step 5: Verify in the browser**

Run: `pnpm dev`. In the browser pane at 1280 and 375 wide:
  - http://localhost:3000/home redirects to `/sign-in`, which matches `1-2-sign-in.png` (no Google button yet, since its keys come in Task 11).
  - Submit `ana@company.com`: the screen becomes `1-3-check-email.png`; Mailpit at http://127.0.0.1:8025 shows "Your sign-in link to Saymo".
  - Open the link from Mailpit: you land on `/home`. Open it again: you land on `/sign-in` with the expired notice.
  - Submit six times within a minute: the sixth shows "Too many tries".

- [ ] **Step 6: Commit**

`git commit -m "feat: sign in and check your inbox screens"`

---

### Task 8: Home header, app bar, Account, 404

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/account/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/features/generation/HomeHeader.tsx`, `src/features/generation/index.ts`, `src/features/account/ProfileCard.tsx`, `DeleteAccountCard.tsx`, `DeleteAccountButton.tsx`, `actions.ts`, `queries.ts`, `index.ts`, `tests/queries.test.ts`, `tests/deleteAccount.test.ts` (all in `src/features/account/`)
- Modify: `src/app/(app)/home/page.tsx`, `messages/en.json` (`Common`, `Home`, `Account`, `NotFound`, `Error`)

**Interfaces:**
- Consumes: `requireUser`, `getUser`, `auth`, `db`, `signInByEmail`, `createAuth`, `createTestDb`.
- Produces:
  - `HomeHeader()` from `@/features/generation`.
  - `signInMethod(db: Database, userId: string): Promise<"google" | "email">` in `queries.ts`.
  - `deletionOutcome(error: unknown): "sign-in-again" | "failed"` in `actions.ts`, mapping Better Auth's session-not-fresh error to `"sign-in-again"`.
  - Server actions `signOut(): Promise<never>` and `deleteAccount(): Promise<{ outcome: "sign-in-again" | "failed" }>` (on success it redirects to `/sign-in?deleted=1` and never returns).
  - `ProfileCard`, `DeleteAccountCard` from `@/features/account`.

- [ ] **Step 1: Copy**

```json
"Common": { "account": "Account" },
"Home": {
  "sticker": "No timeline. No layers.",
  "title": "What are we making today?",
  "lead": "Describe it, drop a link, or upload a video you already have."
},
"Account": {
  "title": "Account",
  "profile": "Profile",
  "signedInWithGoogle": "Signed in with Google.",
  "signedInWithEmail": "Signed in with email.",
  "signOut": "Sign out",
  "deleteLabel": "Delete account",
  "deleteBody": "Removes your videos, brand and billing details. This cannot be undone.",
  "deleteButton": "Delete account",
  "deleteDialogTitle": "Delete your account?",
  "deleteDialogBody": "Your videos, brand and billing details go for good.",
  "deleteConfirm": "Delete account",
  "deleteCancel": "Keep my account",
  "signInAgain": "For your safety, sign in again before deleting your account.",
  "signInAgainButton": "Sign in again",
  "deleteFailed": "We couldn't delete the account. Try again."
},
"NotFound": {
  "sticker": "404",
  "title": "Cut. This page isn't in the script.",
  "lead": "The link is wrong or the page has moved.",
  "home": "Back to Saymo"
},
"Error": {
  "title": "Cut. Something broke on set.",
  "lead": "Try again. If it keeps happening, come back in a few minutes.",
  "retry": "Try again"
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/features/account/tests/queries.test.ts
test("a person who only used email links signed in with email", async () => {
  const { auth, links, db } = await setUpAuth();
  await signInByEmail(auth, "ana@company.com", links);
  const person = await findUser(db, "ana@company.com");
  expect(await signInMethod(db, person.id)).toBe("email");
});
test("a person with a Google account signed in with Google", async () => {
  const { db } = await setUpAuth();
  const person = await insertUser(db, "bo@company.com");
  await db.insert(accounts).values({ userId: person.id, providerId: "google", accountId: "g-1" });
  expect(await signInMethod(db, person.id)).toBe("google");
});

// src/features/account/tests/deleteAccount.test.ts
test("deleting the account removes the person, their sessions and accounts", async () => {
  const { auth, links, db } = await setUpAuth();
  const { cookie } = await signInByEmail(auth, "ana@company.com", links);
  await auth.api.deleteUser({ body: {}, headers: new Headers({ cookie }) });
  expect(await db.select().from(users)).toHaveLength(0);
  expect(await db.select().from(sessions)).toHaveLength(0);
  expect(await db.select().from(accounts)).toHaveLength(0);
  expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
});
test("an old session has to sign in again before deleting", async () => {
  const { auth, links } = await setUpAuth();
  const { cookie } = await signInByEmail(auth, "ana@company.com", links);
  vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60_000);
  const attempt = auth.api.deleteUser({ body: {}, headers: new Headers({ cookie }) });
  await expect(attempt).rejects.toThrow();
  expect(deletionOutcome(await attempt.catch((error: unknown) => error))).toBe("sign-in-again");
});
```

`setUpAuth`, `findUser` and `insertUser` are small helpers at the top of each file, built on `createTestDb` and `createAuth` the way Task 5's `setUp` is (copy it: this is the second use; a third would move it to `testing.ts`).

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm test src/features/account/tests/queries.test.ts src/features/account/tests/deleteAccount.test.ts`. Expected: FAIL.

- [ ] **Step 4: Implement**

`signInMethod`: one query on `accounts` for the user with `providerId = "google"`, limited to one row.

`deletionOutcome`: Better Auth throws an `APIError` whose `body.code` names a session that is not fresh (check the exact code in `better-auth`'s error codes, e.g. `SESSION_EXPIRED` or `SESSION_NOT_FRESH`); narrow with `instanceof APIError` and a Zod check of `body`.

`actions.ts` (`"use server"`): `signOut` calls `auth.api.signOut({ headers: await headers() })` and redirects to `/sign-in`. `deleteAccount` calls `requireUser()`, then `auth.api.deleteUser({ body: {}, headers: await headers() })`, redirects to `/sign-in?deleted=1` on success, and returns `{ outcome: deletionOutcome(error) }` on failure.

`(app)/layout.tsx`: `AppBar` with `Logo` (href `/home`) and, on the right, an `IconButton` with lucide `User` linking to `/account` (`label` from `Common.account`). The brand pill and My videos join in later slices.

`home/page.tsx`: `await requireUser()`, then `HomeHeader` inside `PageWidth width="task"`: Sticker, `text-display` title, `text-lead muted` line, centered as in `2-1-home.png`. The prompt card arrives in slice 2.

`account/page.tsx`: `await requireUser()`, the `text-title` "Account" heading, a two-column grid (gap 14, one column below 760 px) with `ProfileCard` and `DeleteAccountCard`, inside `PageWidth width="task"`.

`ProfileCard` (server): Card labelled "Profile"; `Avatar size="large"`; the name in `text-card-title`, or the email alone when the name is empty; the email in `muted`; "Signed in with Google." or "Signed in with email." from `signInMethod`; a secondary "Sign out" button in a `<form action={signOut}>`.

`DeleteAccountCard` (server) holds the label and body; `DeleteAccountButton` (client) is the outline "Delete account" button that opens `ConfirmDialog`. Confirm runs `deleteAccount`; `sign-in-again` shows the `signInAgain` notice with a "Sign in again" button that runs `signOut`; `failed` shows `deleteFailed`.

`not-found.tsx`: `PublicBar` with the logo and a centered block: Sticker "404", `text-title` heading, lead, primary `ButtonLink` to `/`. `error.tsx` (client): the same layout with the `Error` copy and a primary "Try again" button calling `reset`.

- [ ] **Step 5: Run the tests**

Run: the two account test files, then `pnpm test`. Expected: PASS, everything green.

- [ ] **Step 6: Verify in the browser**

Signed in (through Mailpit): `/home` shows the app bar and the header like the top of `2-1-home.png`; `/account` matches the Profile and Delete account cards of `5-3-account.png`; Sign out returns to `/sign-in` and `/home` then redirects there; Delete account with the dialog lands on `/sign-in` with the goodbye notice; `/no-such-page` shows the 404. Check 375 wide.

- [ ] **Step 7: Commit**

`git commit -m "feat: home header, account with sign out and deletion, and the 404 page"`

---

### Task 9: End-to-end sign-in

**Files:**
- Create: `playwright.config.ts`, `e2e/signIn.spec.ts`
- Modify: `package.json` (`"e2e": "playwright test"`)

**Interfaces:**
- Consumes: the running app and Mailpit's HTTP API (`GET /api/v1/search?query=to:"<email>"`, `GET /api/v1/message/<ID>`).

- [ ] **Step 1: Install**

`pnpm add -D @playwright/test@1.64.1`, then `pnpm exec playwright install chromium`.

- [ ] **Step 2: Write the test**

`playwright.config.ts`: `testDir: "./e2e"`, `use.baseURL: "http://localhost:3000"`, one Chromium project, `webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 }`.

`e2e/signIn.spec.ts`, test "a person signs in with an email link, signs out, signs in again and deletes the account":
  1. A unique address `e2e-<Date.now()>@saymo.test`.
  2. `goto("/account")`: expect the URL `/sign-in`.
  3. Fill "Work email", click "Email me a link": expect the heading "Check your inbox." and the address on the page.
  4. Poll Mailpit for up to 10 seconds for a message to that address, read its text, take the first `http://localhost:3000/api/auth/magic-link/verify…` URL.
  5. `goto(link)`: expect the URL `/home` and the heading "What are we making today?".
  6. Open Account from the app bar: expect the address and "Signed in with email."
  7. Click "Sign out": expect `/sign-in`; `goto("/home")`: expect `/sign-in`.
  8. Sign in again the same way, open Account, click "Delete account", confirm in the dialog: expect `/sign-in` and "Your account is deleted."

- [ ] **Step 3: Run it**

Run: `pnpm e2e`. Expected: 1 passed.

- [ ] **Step 4: Commit**

`git commit -m "test: end-to-end sign-in, sign-out and account deletion"`

---

### Task 10: Documentation and decisions

**Files:**
- Modify: `docs/architecture.md`, `docs/runbooks/setup.md`, `docs/user-flow.md`, `CLAUDE.md` (Commands and Structure), `README.md`, `docs/product/decisions.md`, `docs/handoff.md`

- [ ] **Step 1: Run the `docs` skill and update the pages**

  - `architecture.md`: the folders that now exist, the slices and their public entries, how sign-in works (Better Auth, the email link, Google, the proxy as an optimistic gate, session checks in pages and actions), the database (Drizzle, migrations in `drizzle/`, PGlite in tests), the versions table.
  - `setup.md`: a "Run the app" section: Mailpit (`brew install mailpit`), the app's `.env` variables (`DATABASE_URL` is Railway's `DATABASE_PUBLIC_URL` after TCP Proxy is on; `BETTER_AUTH_SECRET` from `openssl rand -base64 32`; `BETTER_AUTH_URL`; `SMTP_URL`; `EMAIL_FROM`; the Google keys), `pnpm db:migrate`, `pnpm dev`, `pnpm e2e`.
  - `user-flow.md`: the sign-in flow with its states (link sent, resend, expired link, too many tries, Google canceled) and account deletion.
  - `CLAUDE.md`: commands `pnpm dev`, `pnpm build`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm e2e`; the Structure line says which folders exist now.
  - `README.md`: how to run the app.

- [ ] **Step 2: Record the lead's calls with the `decision` skill**

One entry, "The application's foundation": Next.js 16 with the proxy as an optimistic gate and Cache Components off; the theme generated from the tokens with only the token steps defined; Radix through `radix-ui`; Lucide icons at stroke 1.8; next-intl with one locale and typed keys; Drizzle 0.45 (not the 1.0 release candidate) on `pg`, uuid ids made by the database; TLS without certificate checks to Railway's public proxy in development; Better Auth with 10-minute single-use hashed links, 30-day sessions, its rate limiter on in every environment, deletion with a fresh session; one SMTP mailer for Mailpit locally and Resend's SMTP in production; PGlite for database tests; Playwright for the end-to-end path. Rejected: Cache Components now (user data and `use cache` mix badly, and Next 17 makes it the default anyway); postgres.js 4 (two weeks old); Drizzle 1.0 rc; the Resend SDK beside SMTP (two transports for one job).

- [ ] **Step 3: Update `docs/handoff.md`**

State: slice 1 built on the branch `app`; the next is slice 2. Replace the prompt for a new session.

- [ ] **Step 4: Verify and commit**

Run: `pnpm docs:build`. Expected: builds with no dead links.
`git commit -m "docs: the app's foundation, sign-in and how to run it"`

---

### Task 11: Google sign-in keys, with the owner

Not code: the owner creates the OAuth client while the lead waits.

- [ ] **Step 1:** Walk the owner through Google Cloud Console one step per message, waiting for "done": create a project "Saymo"; the OAuth consent screen (External, app name Saymo, the owner's email as support and developer contact, scopes `openid`, `email`, `profile`, the owner as a test user); Credentials → Create OAuth client ID → Web application, authorized JavaScript origin `http://localhost:3000`, authorized redirect URI `http://localhost:3000/api/auth/callback/google`.
- [ ] **Step 2:** The owner copies the client id and runs `printf 'GOOGLE_CLIENT_ID=%s\n' "$(pbpaste)" >> <worktree>/.env`, then the same for the secret with `GOOGLE_CLIENT_SECRET`.
- [ ] **Step 3:** Restart `pnpm dev`. Expected: "Continue with Google" on `/sign-in`; it opens Google's account chooser and lands on `/home`; Account shows "Signed in with Google."
