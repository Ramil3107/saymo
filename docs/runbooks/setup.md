# Setup

What to install and which keys to get in order to run the project and the spike.

## Tools

- Node 22: `nvm install 22 && nvm use`. The version is pinned in `.nvmrc`.
- pnpm 12: the version is pinned in the `packageManager` field of `package.json`, and `corepack enable` picks it up.
- ffmpeg and ffprobe on `PATH`: `brew install ffmpeg` on macOS, check with `ffmpeg -version`.
- Dependencies: `pnpm install`.

## Environment variables

Copy `.env.example` to `.env` and fill it in. `.env` is git-ignored.

| Variable | Used for | Where to get it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | director and frame descriptions (Claude) | [console.anthropic.com](https://console.anthropic.com), API keys |
| `ELEVENLABS_API_KEY` | voice and Scribe transcription | [elevenlabs.io](https://elevenlabs.io), API keys |
| `DEEPGRAM_API_KEY` | Deepgram transcription, for comparison in the spike | [console.deepgram.com](https://console.deepgram.com), API keys |
| `AWS_REGION` | AWS region, `us-east-1` by default | no change needed |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS Rekognition (faces in frames) | access key of the IAM user below |
| `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY` | Remotion Lambda | access key of the same IAM user |
| `REMOTION_LAMBDA_FUNCTION_NAME`, `REMOTION_SERVE_URL` | Remotion function and site on Lambda | appear after the deploy, see [Remotion Lambda](/runbooks/lambda) |
| `SAYMO_DIRECTOR_MODEL`, `SAYMO_VISION_MODEL`, `SAYMO_VISION_BUDGET_USD` | models for the director and vision, vision budget cap per run in dollars | defaults are already in `.env.example` |

## AWS IAM user

One IAM user covers all of AWS. In the IAM console create the user, then create an access key on its Security credentials tab. The user needs:

- `rekognition:DetectFaces` for face detection;
- the Remotion Lambda policies, see [Remotion Lambda](/runbooks/lambda).

Never commit keys. `.env` is listed in `.gitignore`.
