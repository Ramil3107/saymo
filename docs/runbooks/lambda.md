# Remotion Lambda setup

Rendering on Lambda runs in the owner's AWS account. Set it up once per account and region; repeat the site deploy after every change to the video vocabulary.

## 1. IAM policy and role

1. In the AWS console open IAM → Policies → Create policy → JSON and paste the output of `npx remotion lambda policies role`. Name it exactly `remotion-lambda-policy`.
2. IAM → Roles → Create role for the Lambda service, attach `remotion-lambda-policy`, name it exactly `remotion-lambda-role`.

## 2. IAM user and keys

1. IAM → Users → Create user `remotion-user` without console access.
2. Add an inline policy from the output of `npx remotion lambda policies user`, plus the action `rekognition:DetectFaces` on `*` (the pipeline detects faces with Rekognition using the same keys).
3. Create an access key. Put it into `.env` twice: as `REMOTION_AWS_ACCESS_KEY_ID` / `REMOTION_AWS_SECRET_ACCESS_KEY` (read by Remotion) and as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (read by the AWS SDK for Rekognition and S3). Set `AWS_REGION`, for example `us-east-1`.
4. Check: `npx remotion lambda policies validate`.

## 3. Function and site

1. `npx remotion lambda functions deploy --memory=2048 --timeout=120` prints the function name. Put it into `.env` as `REMOTION_LAMBDA_FUNCTION_NAME`.
2. `npx remotion lambda sites create src/video/remotion/index.ts --site-name=saymo` prints the serve URL. Put it into `.env` as `REMOTION_SERVE_URL`. Run this again after every vocabulary change; the same `--site-name` overwrites the previous deploy.
3. `npx remotion lambda quotas` shows the concurrency limit; new accounts may be capped at 10 and need a quota increase for parallel renders.

## 4. Smoke test

`npx remotion lambda render $REMOTION_SERVE_URL saymo --props=fixtures/video.sample.json` prints an S3 link to the MP4.

## 5. Through the pipeline

`pnpm spike --run <id> --resume --render lambda` re-renders an existing run on Lambda. Local assets (the source video, voice clips, music) are uploaded to the Remotion bucket under `assets/<run id>/` and referenced by presigned URLs that last two hours; the render cost from `getRenderProgress` lands in `metrics.json` under the `render` step.
