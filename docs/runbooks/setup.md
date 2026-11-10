# Setup

What to install and which keys to get in order to run the project and the spike.

## Tools

- Node 22: `nvm install 22 && nvm use`. The version is pinned in `.nvmrc`.
- pnpm 12: the version is pinned in the `packageManager` field of `package.json`, and `corepack enable` picks it up.
- ffmpeg and ffprobe on `PATH`: `brew install ffmpeg` on macOS, check with `ffmpeg -version`.
- Dependencies: `pnpm install`.
- Run a single test file with `pnpm test <path>` (not `pnpm test -- <path>`: pnpm 12 passes the `--` through).
- If `pnpm add` reports ignored build scripts, run `pnpm approve-builds`.

## Environment variables

Copy `.env.example` to `.env` and fill it in. `.env` is git-ignored.

| Variable | Used for | Where to get it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | director and frame descriptions (Claude) | [console.anthropic.com](https://console.anthropic.com), API keys |
| `ELEVENLABS_API_KEY` | voice and Scribe transcription | [elevenlabs.io](https://elevenlabs.io), API keys |
| `DEEPGRAM_API_KEY` | Deepgram transcription, the reserve behind `--transcriber deepgram` | [console.deepgram.com](https://console.deepgram.com), API keys |
| `AWS_REGION` | AWS region, `us-east-1` by default | no change needed |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS Rekognition (faces in frames) | access key of the IAM user below |
| `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY` | Remotion Lambda | access key of the same IAM user |
| `REMOTION_LAMBDA_FUNCTION_NAME`, `REMOTION_SERVE_URL` | Remotion function and site on Lambda | appear after the deploy, see [Remotion Lambda](/runbooks/lambda) |
| `SAYMO_DIRECTOR_MODEL`, `SAYMO_VISION_MODEL`, `SAYMO_VISION_BUDGET_USD` | models for the director and vision, vision budget cap per run in dollars | defaults are already in `.env.example` |

## AWS IAM user

The account itself must be created with Sign up for AWS (advanced); the reasons and the quota caveats are in [Remotion Lambda](/runbooks/lambda). One IAM user covers all of AWS. In the IAM console create the user, then create an access key on its Security credentials tab. The user needs:

- `rekognition:DetectFaces` for face detection;
- the Remotion Lambda policies, see [Remotion Lambda](/runbooks/lambda).

Never commit keys. `.env` is listed in `.gitignore`.

## Run the app

1. Mail: `brew install mailpit`. `pnpm dev` starts it beside the app; the inbox is at `http://localhost:8025`.
2. Database: the app needs a Postgres. In development it is a Railway Postgres. In the Railway console open the Postgres service, then Settings, Networking, Public Networking, and add a TCP Proxy on port 5432. Without it only services inside Railway can connect. The app's `DATABASE_URL` is then Railway's `DATABASE_PUBLIC_URL`; the internal `DATABASE_URL` that Railway shows works only inside Railway.
3. Put these in `.env`:

| Variable | Used for | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | the app's Postgres | Railway's `DATABASE_PUBLIC_URL`, see above |
| `BETTER_AUTH_SECRET` | signs sessions and links, at least 32 characters | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | the app's own address | `http://localhost:3000` locally |
| `SMTP_URL` | the mail server | `smtp://127.0.0.1:1025` for Mailpit (the default); Resend's SMTP in production |
| `EMAIL_FROM` | the sender of the emails | for example `Saymo <hello@saymo.local>` (the default) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | sign-in with Google, optional, set both or neither | a Google Cloud OAuth client; the redirect URI is `<BETTER_AUTH_URL>/api/auth/callback/google` |

4. `pnpm db:migrate` applies the migrations in `drizzle/` to that database.
5. `pnpm dev` starts the app on port 3000 and Mailpit. Open the app, enter an email, and open the link from Mailpit.
6. `pnpm e2e` runs the end-to-end test: sign in with a link, sign out, delete the account. It starts `pnpm dev` itself if it is not running, and it needs Chromium: `pnpm exec playwright install chromium`.
