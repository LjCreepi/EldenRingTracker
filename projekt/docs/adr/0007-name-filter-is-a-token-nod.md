# The character-name filter is a deliberate token, not FromSoftware's

## Context

*Elden Ring* caps character names at 16 characters and runs them through an
aggressive, undocumented profanity filter that masks matched substrings with
asterisks — famously censoring "Knight" as "K\*\*\*ht" for the letters it
contains. That filter is display-only: the name is still stored and usable.

We want the 16-character cap and the *flavour* of that filter (the "K\*\*\*ht"
easter-egg is well known) without shipping — or maintaining — a real profanity
word list, with its false-positive and licensing baggage, on a fan tracker that
has no multiplayer and no user-to-user visibility.

## Decision

- Names are capped at 16 characters (hard, enforced at the input) and trimmed;
  an empty name is rejected. Any other character is allowed. Names need not be
  unique.
- `censorName()` (`src/app/features/character/name.ts`) masks a short,
  hand-written list of substrings with asterisks — case-insensitive,
  length-preserved. `nig` is on the list, so "Knight" → "K\*\*\*ht": the joke is
  the point. The list is deliberately tiny; it is **not** FromSoftware's and is
  not meant to be complete or to catch everything.
- Censorship is display-only. The raw name is what is stored, what the Mirror
  edits, and — compared through `censorName` — what the delete-confirmation
  prompt accepts (typing either the real name or its masked form works).

## Consequences

- This is not content moderation; do not treat it as such.
- Adding or removing a substring is a one-line change with no migration — stored
  names are raw.
