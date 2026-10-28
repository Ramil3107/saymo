---
name: decision
description: Record a decision that has been made in the decision log. Call when a technology, service, architecture or scope has been chosen.
---

1. Collect from the conversation and ask for what is missing: the date, what was decided, why, what was rejected.
2. Insert the entry at the top of `docs/product/decisions.md`, right below the `---` line, following the neighboring entries: `### <date> · <title>` (date in YYYY-MM-DD format) and the bullets `- **Decided:**`, `- **Why:**`, `- **Rejected:**`. Write the entry in English.
3. Commit: `docs: decision <title>`.
