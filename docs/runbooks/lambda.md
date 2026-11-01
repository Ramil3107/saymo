# Remotion Lambda setup

Rendering on Lambda runs in the owner's AWS account. Set it up once per account and region; repeat the site deploy after every change to the video vocabulary.

## 0. Which AWS account

Use an account created with [Sign up for AWS (advanced)](https://docs.aws.amazon.com/accounts/latest/reference/getting-started.html), on the Paid plan. The default "new AWS experience" with projects does not work for Saymo: a project is locked to one Region chosen by AWS, Rekognition is not available in all of them, and the account cannot change its own quotas.

A brand-new account starts with Lambda quotas that are too small for Remotion: 5 concurrent executions and 512 MB of function memory. Request the concurrency increase in the [Service Quotas console](https://us-east-1.console.aws.amazon.com/servicequotas/home/services/lambda/quotas/L-B99A9384) (1000 is enough); the memory ceiling rises with usage or through an AWS Support case. Until then, deploy the function with `--memory=512` and render locally.

## 1. IAM policy and role

1. In the AWS console open IAM → Policies → Create policy → JSON and paste `infra/aws/remotion-lambda-role-policy.json`. Name it exactly `remotion-lambda-policy`.
2. IAM → Roles → Create role for the Lambda service, attach `remotion-lambda-policy`, name it exactly `remotion-lambda-role`.

## 2. IAM user and keys

1. IAM → Users → Create user `saymo` without console access, attach no policies.
2. On the user's Permissions tab add an inline policy from `infra/aws/saymo-user-policy.json`: the Remotion user policy plus `rekognition:DetectFaces`. Name it `saymo-user-policy`.
3. Security credentials → Create access key, use case "Application running outside AWS". Put it into `.env` twice: as `REMOTION_AWS_ACCESS_KEY_ID` / `REMOTION_AWS_SECRET_ACCESS_KEY` (read by Remotion) and as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (read by the AWS SDK for Rekognition and S3). Set `AWS_REGION` to `us-east-1`.
4. Check: `npx remotion lambda policies validate` prints 32 green lines. The policy files are regenerated with `npx remotion lambda policies role` and `npx remotion lambda policies user` after a Remotion upgrade.

## 3. Function and site

1. `npx remotion lambda functions deploy --memory=2048 --timeout=120` prints the function name (`--memory=512` while the account's memory quota is still 512 MB). Put it into `.env` as `REMOTION_LAMBDA_FUNCTION_NAME`.
2. `npx remotion lambda sites create src/video/remotion/index.ts --site-name=saymo` prints the serve URL. Put it into `.env` as `REMOTION_SERVE_URL`. Run this again after every vocabulary or font library change (the site carries `public/`, fonts included); the same `--site-name` overwrites the previous deploy.
3. `npx remotion lambda quotas` shows the concurrency limit; new accounts may be capped at 10 and need a quota increase for parallel renders.

## 4. Smoke test

`npx remotion lambda render $REMOTION_SERVE_URL saymo --props=fixtures/video.sample.json` prints an S3 link to the MP4.

## 5. Through the pipeline

`pnpm spike --run <id> --resume --render lambda` re-renders an existing run on Lambda. Local assets (the source video, voice clips, music) are uploaded to the Remotion bucket under `assets/<run id>/` and referenced by presigned URLs that last two hours; the render cost from `getRenderProgress` lands in `metrics.json` under the `render` step.
