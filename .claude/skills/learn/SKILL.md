---
name: learn
description: Record a lesson and propose a rule. Call after a task or feedback from the owner, when something went wrong or the result had to be redone.
---

Every failure becomes a rule, a primitive or a check, never a template.

1. If not stated, ask what happened.
2. In `docs/learnings.md`, add an entry `### <date> · <title>` (date in YYYY-MM-DD format). Write the entry in English. New entries go on top, right below the intro line. The fields are bullets, as in `docs/product/decisions.md`: `- **What happened:**`, `- **Lesson:**`, `- **Rule:**`. In "Rule", say where to put it: `CLAUDE.md` or a specific skill in `.claude/skills/`.
3. Show the diff of the rule. Apply it only after the owner confirms.
4. Commit: `docs: learning <title>`.
