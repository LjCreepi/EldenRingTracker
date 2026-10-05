# Golden Seed / Sacred Tear auto-inventory sync and a separate Flask Used Count

## Context

Golden Seeds and Sacred Tears were already tracked as map-completable Marker
Categories and as Items in the Item Catalog, but the two were unconnected —
finding one on the map did nothing to Inventory, and nothing modelled the fact
that finding one isn't the same as spending it at a Site of Grace to raise
Flask Charges / Flask Potency.

CONTEXT.md's "Inventory" entry says quantity is entered "by hand" and is a
live mirror that "goes up and down." Auto-populating it from map Completion is
a deliberate, narrow exception to that — worth writing down since it's the
first place Completion reaches into Inventory.

## Decision

- `Marker` gained an optional `itemId` field. It is populated only for
  Golden Seed / Sacred Tear markers (via `CATEGORY_ITEM_LINK` in
  `scripts/prepare-map-assets.mjs`), but the mechanism is general.
- `ProgressService.toggle()` looks up the toggled marker's `itemId` and calls
  `InventoryService.adjust()` by ±1 — **symmetric**: un-completing a marker
  removes the Item again, same as completing it added it. Inventory must
  always reflect "currently have," not "ever collected," so this has to mirror
  both ways rather than being a one-way add.
- Actually *using* a Golden Seed / Sacred Tear (permanently raising Flask
  Charges / Potency) is a **separate, manual** action, tracked as its own
  per-Character counter (`FlaskService`, key `flaskUsage`) rather than reusing
  Inventory quantity. Using one decrements Inventory by 1 and increments the
  Used count by 1; un-using reverses both. This mirrors the real mechanic
  (found ≠ spent at a Grace) and keeps "Used" from being silently undone by
  an unrelated map-completion toggle.
- Flask Charges / Flask Potency are computed from the Used count via a
  community-documented cost-per-level table (`stats.ts`:
  `GOLDEN_SEED_LEVEL_COST`, `SACRED_TEAR_LEVEL_COST`), not from Inventory
  quantity or Completion count directly.

## Why

- Re-deriving Flask stats from Completion count alone would conflate "found"
  with "spent," which is wrong in-game: both Golden Seeds and Sacred Tears are
  spent one at a time at a Site of Grace, and a player can be sitting on
  unspent ones.
- Keeping Inventory auto-sync symmetric avoids a second, silently-diverging
  source of truth for "how many do I have" — the alternative (one-way add)
  would leave Inventory permanently overcounting after any completion-toggle
  correction.
- A general `itemId` field (rather than a Golden-Seed/Sacred-Tear-specific
  flag) keeps the door open for other one-Item-per-Marker categories later
  without another schema change.

## Consequences

- `npm run prepare:map` must be re-run whenever `CATEGORY_ITEM_LINK` changes;
  it's additive to the generated JSON, no migration needed for existing saves.
- Un-completing a Golden Seed/Sacred Tear marker after having *Used* it will
  still remove one from Inventory, which can drive it to 0 — this is
  intentional (Inventory tracks "currently have," and the map is the source
  of truth for whether it was ever found), but it does not touch the Used
  count, which only the Status-screen controls can change.
- Flask Charges / Flask Potency are not flagged "≈ approximate" like most of
  `stats.ts` (see docs/adr/0005): the cost table gives a discrete, exact
  result for a given Used count, even though the table itself is
  community-sourced rather than verified against game files.
