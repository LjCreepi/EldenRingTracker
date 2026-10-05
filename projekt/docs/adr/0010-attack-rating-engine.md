# Attack Rating: a formula engine, not a vendored per-weapon dataset — and where its fidelity actually lands

## Context

ADR 0005 deferred Attack Rating entirely: "the exact maths... requires
per-weapon scaling coefficients, affinity tables and upgrade-level
multipliers that the Fan API does not provide," and treated it as the least
essential stat for a tracker. This ADR picks it back up and supersedes 0005
**only for Attack Rating** — every other fidelity call in 0005 stands.

Two paths were open: (a) vendor a community per-weapon/per-affinity/
per-upgrade-level dataset (like `elden-ring-compass` is vendored for map
tiles, ADR 0002), or (b) implement the general formula — attribute soft-cap
curves applied to the catalog's own base attack/scaling — without new
per-weapon data. (b) was chosen up front (see the grilling session this
feature came out of) to avoid taking on a large new vendored dataset.
Implementing (b) surfaced three sourcing problems, each resolved differently:

## Decisions

**1. Upgrade-level growth — verified.** Real per-weapon attack tables
(Longsword for Standard, Moonveil for Somber, both cross-checked against a
Fextralife fetch) gave the actual attack-per-level curve. It turns out to be
a shared ratio table, not per-weapon, so this generalizes cleanly:
`STANDARD_UPGRADE_MULTIPLIER` (+0→+25, 1.0×→2.445×) and
`SOMBER_UPGRADE_MULTIPLIER` (+0→+10, 1.0×→2.438×) in `stats.ts`. A unit test
pins the Longsword's real +0 (110) and +10 (173) values against the engine's
output.

**2. The attribute soft-cap curve and grade coefficients — best-effort,
disclosed.** The real per-weapon `calcCorrectGraph` system (confirmed by
reading the open-source `elden-ring-weapon-calculator`'s source) needs data
baked from the game's own files — even that project doesn't ship it as plain
data, it rebuilds it from a game install. Only the soft-cap *locations*
(~20/50/80) are well-established from community writeups; the exact
percentages at each point aren't verified the same way the upgrade curves
are. Asked directly, the call was: ship a reasonable, labeled approximation
rather than block on unobtainable exact numbers (`SCALING_SOFT_CAP`,
`GRADE_MAX_SCALING` in `stats.ts`).

**3. Which weapons are Somber (+10 cap) vs. Standard (+25) — best-effort,
disclosed, user-correctable.** This turned out to be a *per-weapon* fact
(`reinforceTypeId` in the game's own data), not something derivable from
weapon category as originally assumed going in — Colossal Weapons,
Glintstone Staves, Sacred Seals etc. are mostly Standard, with only specific
named/unique weapons being Somber. A verified, complete list of the ~137
special weapons/shields wasn't obtainable in the time available (wiki
listing pages describe the mechanic but don't enumerate every weapon in
fetchable, non-JS-rendered form). `SOMBER_WEAPON_IDS` in
`weapon-build.model.ts` is a curated, non-exhaustive list of well-known ones,
used only to seed the Upgrade Path picker's *default* — the picker is a plain
Standard/Somber toggle the user can always correct, so a wrong guess costs
one tap, not a wrong number nobody can fix.

**Affinity is stored and selectable (any affinity, no legality check — matching
the "math over blocking impossible combos" call already made for other build
choices) but does not yet change the computed Attack Rating.** Real infusion
math needs either per-affinity attack/scaling-reassignment tables (not
available any more than the base data was) or a fabricated multiplier with no
source — both rejected. The UI says so inline when a non-Standard affinity is
selected.

## Why

- Splitting fidelity per-component (verified / best-effort / not-yet-modeled)
  and disclosing each honestly beats a single blanket confidence claim that
  would overstate the shaky parts and undersell the solid ones.
- A wrong Upgrade Path *default* is cheap to fix (one tap); a wrong Attack
  Rating with no way to correct it is not — that asymmetry is why the Somber
  list only seeds a default instead of being enforced.
- Attack Rating deliberately does **not** carry the same "≈" marker as the
  rest of `DerivedStats` (docs/adr/0005): it lives on the Equipment screen
  with its own disclosure text, not folded into the Status screen's blanket
  approximation notice.

## Consequences

- `Loadout.armamentBuilds` is new, additive per-slot state
  (`{ upgradeLevel, upgradePath, affinity, twoHanded }`), reset to a fresh
  default whenever a *different* Item is equipped into that slot (upgrade
  level/affinity belong to the specific weapon instance, not the slot).
- Extending `SOMBER_WEAPON_IDS` or correcting a wrong entry is a one-line,
  no-migration change.
- Making Affinity actually change Attack Rating, or replacing the best-effort
  soft-cap curve with verified numbers, are both additive follow-ups if a
  reliable data source turns up later — no schema change needed, just swapping
  the coefficients in `stats.ts`.
