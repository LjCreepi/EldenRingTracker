# Marker catalog schema: groups, default-hidden categories, bonus steps

## Context

Growing the map from 2 marker categories (bosses, sites of grace) to 14 — adding
dungeons, merchants, and ten collectible types derived from `placements.ts` —
forced three additions to `marker-catalog.json` and the completion model. All
three are awkward to change once Characters have saved progress against them, so
they are recorded together.

## Decision

1. **Category Groups.** The catalog gains a `groups: [{ id, name, icon }]` list;
   a `MarkerCategory` may carry `group`. Groups are a menu-only visual clustering
   (*Golden Seeds & Sacred Tears*, *Upgrade Materials*, *Consumables & Kit*) with
   **no toggle of their own** — every category inside stays independently
   switchable. Categories without a `group` render as a flat list above the
   groups.

2. **Default-hidden categories.** A `MarkerCategory` may carry
   `defaultHidden: true` (all ten collectible categories do). Visibility is
   stored as two explicit lists in preferences — `hiddenCategories` (opted out)
   and `shownCategories` (opted in) — and a category in neither follows its
   `defaultHidden` flag. This means a *new* default-hidden category added in a
   later catalog stays hidden for existing users until they opt in, rather than
   flooding their map on the next deploy.

3. **Bonus steps.** A `MarkerCategory` may carry
   `bonusStep: { id, action, doneStatus, note? }` — an optional second completion
   step that is **tracked but not counted as progress**. Currently only a
   Merchant's Bell Bearing. It is stored as a Completion record under the id
   `<markerId>#<step id>` (e.g. `merchant-1037540705#bell`), so `ProgressService`
   needs no schema change — synthetic ids just never match a real marker id and
   so never inflate a category's `done / total`. A completed marker with an open
   bonus step shows a small flag on its map pin.

## Consequences

- `Preferences` grew a `shownCategories` field; old stored preferences merge
  forward (missing field → `[]`).
- Completion ids are now a small language, not just `boss-*` / `grace-*`. A future
  save-file import has to know that `#bell` records are bonus steps, and that
  collectible ids are `<category>-<x>-<y>` (position-derived — there is no stable
  in-game flag exposed for item pickups in `placements.ts`).
- Re-running `prepare-map-assets.mjs` after re-pulling compass-data can move a
  collectible marker by a pixel and thus change its id, orphaning a Completion
  record. Acceptable: the data is near-static and the cost is one lost tick.
