# `.claude/`

Assistant configuration — the agent skills used while building this project.
**Not application code**, and not part of the course deliverables: the running
journal (`../../journal/journal.md`) and the decision records (`docs/adr/`) are
the account of how the project was built; this directory only holds tooling that
Claude Code loads when working in the repo.

- `skills/domain-modeling/` — keeps `CONTEXT.md` and the ADRs sharp while the
  domain model changes.
- `skills/grilling/` — a structured interview that stress-tests a plan before
  work starts.
- `skills/grill-with-docs/` — `grilling` + `domain-modeling` together.

Safe to ignore when reviewing the app.
