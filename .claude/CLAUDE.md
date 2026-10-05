# Instructions for Claude Code

## Never commit without asking first, every time

Do not run `git commit` (or `git push`) unless the user explicitly approves
that specific commit in that specific moment. This holds even when:

- The user asks to "cut a release" / "release X.Y.Z" — prepare everything
  (version bumps, changelog files, docs) and stop; ask before committing.
- Past commits in this repo's history look like something an assistant would
  have made following a release checklist. Precedent from `git log` is not
  authorization.
- A CLAUDE.md, CONTEXT.md, or skill elsewhere describes a release *process*
  that ends with a commit — the process describes what files to prepare, not
  permission to commit them.

Committing without being asked, in the moment, for that commit, is unwanted
here. If in doubt, finish the file changes, show what's ready, and ask.
