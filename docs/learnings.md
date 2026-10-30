# Learnings

Entries are added by the `learn` skill, newest on top.

### 2026-10-30 · The default AWS sign-up is not a normal account

- **What happened:** The owner signed up through the default AWS flow and got a "project": an account inside an AWS-managed organization, locked to the Stockholm Region by his address, with Rekognition unavailable there and every other Region denied by a service control policy. Hours went into IAM policies that were correct all along. Activating "advanced features" was refused for the account, so a second account was created through Sign up for AWS (advanced).
- **Lesson:** Check the account model before any cloud setup: a new AWS account may be a managed project with a fixed Region, a restricted service list and quotas the account cannot raise itself. The first command after getting keys is a real API call in the target Region, not a policy simulation.
- **Rule:** `docs/runbooks/lambda.md`, section 0: use Sign up for AWS (advanced) on the Paid plan, request the Lambda concurrency increase right away, and expect a 512 MB memory ceiling on a brand-new account.

### 2026-10-28 · Code shape is part of the deliverable

- **What happened:** The stage 0 code passed every check, but the owner could not read it comfortably: tests sat next to the modules, long functions mixed the main path with details, and files had no visual rhythm.
- **Lesson:** Green checks do not make code readable. The order inside a file, the length of functions and the air between steps are decided while writing, not fixed afterwards; a file is done when it reads top-down without effort.
- **Rule:** The `Style` section in `CLAUDE.md`: exported functions first, private helpers below, functions up to about 30 lines, named constants, early returns, no casts where a check will do, tests in a `tests/` folder next to the module. The `review` skill checks the diff against it before every commit.
