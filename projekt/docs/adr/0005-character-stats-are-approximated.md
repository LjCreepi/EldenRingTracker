# Character stats are approximated; Attack Rating is not simulated

> **Superseded for Attack Rating by docs/adr/0010.** Attack Rating is now
> simulated; every other decision below still stands.

## Context

The Status and Equipment screens show a character sheet in *Elden Ring*'s style:
attributes on the right, derived stats below (HP, FP, Stamina, Equip Load, Poise,
Discovery, defences, resistances), and a weapon-stat panel in the middle
(Attack Power, Guarded Damage Negation, scaling).

The exact maths behind those numbers is large and fiddly: the HP/FP/Stamina/
Equip-Load curves are per-point lookup tables with multiple soft caps; defences
and resistances mix flat armour values with attribute- and level-based terms; and
weapon **Attack Rating** requires per-weapon scaling coefficients, affinity
tables and upgrade-level multipliers that the Fan API does not provide. This is a
progress tracker built on a tight ÜK schedule, not a build calculator.

## Decision

- **Exact where it's cheap:** current equipped weight, Equip Load percentage and
  the light / medium / heavy / overloaded roll breakpoint. Level is derived
  exactly from Class base + points invested.
- **Approximated:** HP, FP, Stamina and max Equip Load are interpolated between
  the community-documented attribute breakpoints; Poise, Discovery, defences and
  resistances use simplified formulas. These are close, not canonical.
- **Not simulated in v1:** weapon Attack Rating. The weapon panel shows the
  catalog's base values with a "scaling not simulated" note. Equipped weapons
  carry no upgrade level or affinity yet.
- Every screen that shows an approximated number carries a visible "≈ approximate"
  marker so nobody mistakes it for a canonical value.

## Why

- The stats players actually plan around — survivability band, roll type, equip
  load headroom — come out close enough to be useful for cheap.
- Attack Rating is the genuinely hard part and the least essential for a tracker;
  deferring it keeps the first cut shippable.

## Consequences

- Do not cite these numbers against a real save file or a build calculator.
- Upgrade level + affinity + real AR is recorded as planned work
  (`README.md` → "Planned, not yet built"). Adding it later means new fields on
  the Loadout's armament slots and a real scaling engine — additive, no migration
  of existing data.
