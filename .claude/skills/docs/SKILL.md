---
name: docs
description: Update the documentation pages and the user flow diagram in the same commit as the change. Call after code changes, before the commit.
---

A task is not closed until the documentation is updated. The pages go in the same commit as the change, not after it.

1. Find the affected areas from the uncommitted diff: `git diff --name-only HEAD` and `git status --short`.
2. Map the areas to pages:
   - `src/video` → `docs/video-schema.md` and `docs/vocabulary.md`
   - `src/worker` → `docs/pipeline.md`
   - `src/lib` → `docs/architecture.md`
   - user flows → `docs/user-flow.md`
3. Update the pages.
4. Run `pnpm docs:build`, fix build errors and dead links.
5. Add the pages to the commit with the change, do not make a separate commit after it. The `docs:` prefix is only for a commit that contains documentation alone.
