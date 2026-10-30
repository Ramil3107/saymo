# Learnings

Entries are added by the `learn` skill, newest on top.

### 2026-10-30 · A spike render without a vocabulary reads as the product

- **What happened:** The stage 0 renders proved the pipeline, but with six bare primitives and no composition they looked like a bad product to the owner, who compared them with hand-made reels and asked what there was to evaluate. A design spike the same day closed most of the gap and the owner reordered the work: vocabulary first.
- **Lesson:** The owner judges what he sees, not what a stage was meant to prove. A spike that produces video must either carry one designed scene or be presented with a clear statement of what is and is not there yet.
- **Rule:** `CLAUDE.md`, "How to work with me": when showing a render, say in one line what it proves and what is not there yet to be judged.

### 2026-10-30 · The default AWS sign-up is not a normal account

- **What happened:** The owner signed up through the default AWS flow and got a "project": an account inside an AWS-managed organization, locked to the Stockholm Region by his address, with Rekognition unavailable there and every other Region denied by a service control policy. Hours went into IAM policies that were correct all along. Activating "advanced features" was refused for the account, so a second account was created through Sign up for AWS (advanced).
- **Lesson:** Check the account model before any cloud setup: a new AWS account may be a managed project with a fixed Region, a restricted service list and quotas the account cannot raise itself. The first command after getting keys is a real API call in the target Region, not a policy simulation.
- **Rule:** `docs/runbooks/lambda.md`, section 0: use Sign up for AWS (advanced) on the Paid plan, request the Lambda concurrency increase right away, and expect a 512 MB memory ceiling on a brand-new account.

### 2026-10-28 · Code shape is part of the deliverable

- **What happened:** The stage 0 code passed every check, but the owner could not read it comfortably: tests sat next to the modules, long functions mixed the main path with details, and files had no visual rhythm.
- **Lesson:** Green checks do not make code readable. The order inside a file, the length of functions and the air between steps are decided while writing, not fixed afterwards; a file is done when it reads top-down without effort.
- **Rule:** The `Style` section in `CLAUDE.md`: exported functions first, private helpers below, functions up to about 30 lines, named constants, early returns, no casts where a check will do, tests in a `tests/` folder next to the module. The `review` skill checks the diff against it before every commit.
