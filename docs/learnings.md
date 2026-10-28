# Learnings

Entries are added by the `learn` skill, newest on top.

### 2026-10-28 · Code shape is part of the deliverable

- **What happened:** The stage 0 code passed every check, but the owner could not read it comfortably: tests sat next to the modules, long functions mixed the main path with details, and files had no visual rhythm.
- **Lesson:** Green checks do not make code readable. The order inside a file, the length of functions and the air between steps are decided while writing, not fixed afterwards; a file is done when it reads top-down without effort.
- **Rule:** The `Style` section in `CLAUDE.md`: exported functions first, private helpers below, functions up to about 30 lines, named constants, early returns, no casts where a check will do, tests in a `tests/` folder next to the module. The `review` skill checks the diff against it before every commit.
