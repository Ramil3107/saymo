---
name: review
description: Self-check of the diff against the code rules. Call before every commit.
---

1. Run `pnpm check && pnpm typecheck && pnpm test`. Anything red goes straight into the findings.
2. Go through the diff (`git diff HEAD`, new files from `git status --short`) and check it against the checklist from "Code rules" in `CLAUDE.md`:
   - readability: the code is clear without comments;
   - slices do not reach into each other;
   - Zod is in place at the boundaries;
   - no extra queries or heavy imports;
   - logic has tests;
   - interface strings go through localization;
   - styles go through tokens;
   - no comments or explanations from the AI.
3. Output the list of findings: file, line, what is wrong. Do not fix anything.
