# Physick Mix: separate from Loadout, and only 4 of 29 tears have modeled numbers

## Context

Wondrous Physick (mixing two Crystal Tears) didn't exist in the app at all.
Two open questions shaped the implementation:

1. Crystal Tears aren't their own Item Category — the Fan-API-driven fetch
   script sorts them into `key-items` or `consumables` by name-matching (see
   `scripts/fetch-item-catalog.mjs`), mixed in with unrelated items (Stonesword
   Keys, Memory Stones, other consumables). The Physick Mix picker needs to
   offer *only* Crystal Tears.
2. Getting each tear's exact numeric effect right matters more here than for
   most of `stats.ts`: Strength/Dexterity/Intelligence/Faith-knot Crystal
   Tears change weapon-scaling attributes, so a wrong number would feed
   straight into Attack Rating once that engine exists.

## Decision

- **A hand-curated id list** (`CRYSTAL_TEAR_ITEM_IDS` in
  `core/models/physick.model.ts`), not a new Item Category. Verified against
  the catalog: exactly 29 ids matched, the known base-game Crystal Tear count.
  Reclassifying them into a real Category would mean re-running
  `fetch-item-catalog.mjs` against the network Fan API and touching a
  generated file by hand otherwise — out of proportion to what a picker filter
  needs.
- **Physick Mix is its own store** (`PhysickService`, key `physickMix`), not
  bolted onto `Loadout`, even though the Equipment-screen UI treats it like
  another slot picker. It isn't part of the Character's combat Loadout in the
  game sense, and keeping it separate avoids widening `EquipSlotId` (and every
  switch over it) for a two-slot special case.
- **Only 4 of the 29 tears carry a modeled numeric effect**
  (`CRYSTAL_TEAR_ATTRIBUTE_EFFECTS`: the four knot tears, +10 to their
  attribute for 180s, cross-checked against Game8/Fextralife) plus 2 instant
  restores (`CRYSTAL_TEAR_INSTANT_RESTORE`: Crimson/Cerulean Crystal Tear,
  50% HP/FP). A first web-fetch summary of the wiki table gave a wrong number
  for Cerulean (20% instead of the correct 50%) before a second, targeted
  fetch caught it — a reminder that these numbers need a real source, not
  recall. The other 23 tears show their catalog `effect`/`description` text
  only; no numeric delta is modeled for them yet.
- The Physick Mix's "Active" toggle has no timer — it's a deliberate,
  reversible on/off the user flips to preview the effect, matching how the
  Flask Used Count (docs/adr/0008) is also manual rather than simulated.

## Why

- The 4 knot tears are exactly the ones that matter for Attack Rating; the
  other 23 affect HP/FP/Stamina/defense/poise/status/rune-loss, none of which
  this feature pass touches. Modeling all 29 precisely would mean sourcing and
  verifying ~25 more numbers for stats nothing currently reads.
- A wrong "close enough" number silently poisons Attack Rating later, so the
  bar here is "verified against a source" or "not modeled," never "recalled
  and probably right."

## Consequences

- Adding a numeric effect for one of the remaining 23 tears later just means
  adding an entry to `CRYSTAL_TEAR_ATTRIBUTE_EFFECTS` (or a new effect-kind
  table if it's not an attribute delta) — additive, no migration.
- If Crystal Tears ever need real Inventory-tab placement (their own Category),
  that's a separate, larger change gated on re-running the Fan API fetch.
