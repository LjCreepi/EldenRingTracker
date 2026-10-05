# Item catalog: a static asset from the Fan API, with our own ids

## Context

The Character menu (Inventory / Equipment / Status) needs a catalog of every
obtainable *Elden Ring* item — roughly 1,800 entries across weapons, armour,
talismans, spells, spirit ashes, ashes of war and the consumable / material /
key-item lists — each with an icon, description and in-game stats. Producing this
by hand is out of the question. The **Elden Ring Fan API**
(`eldenring.fanapis.com`) already serves it, and ADR 0002 already accepts that
API as an imagery source for the map.

Once a Character has saved inventory quantities and a loadout against item ids,
changing those ids is a data migration. The Fan API's own ids are opaque hashes
(`17f69e47912l0i1z0lip3kamll88h`) with no documented stability guarantee across
its refreshes — the same failure mode as the position-derived collectible marker
ids in ADR 0003.

## Decision

1. **Static asset, same pipeline as the map.** A new manual, online script
   `scripts/fetch-item-catalog.mjs` (mirrors `fetch-marker-images.mjs`) pulls the
   chosen Fan API resources plus 64 px icons (downscaled with `sharp`), writing
   `src/assets/data/item-catalog.json` and per-resource icon folders
   `src/assets/items/<resource>/<slug>.png`. `ItemCatalogService` loads the JSON
   at runtime over `HttpClient`, exactly like `MarkerCatalogService`. The catalog
   carries a content-hash `version` (prefix `i…`), independent of the app SemVer.
   A production build ships the committed JSON and icons unchanged and never runs
   the script.

2. **Our own ids.** Each item's `id` is a slug of its name
   (`radagons-soreseal`, `smithing-stone-3`). The Fan API hash is kept only as
   `source` metadata for re-fetching. Names are stable; hashes are assumed not to
   be.

3. **Item Category is ours, not the API's.** The Fan API types items only as
   `Consumable` / `Reusable` / `Misc`, too coarse for the in-game inventory tabs.
   The script assigns each item one `category` (mirroring *Elden Ring*'s tabs) by
   resource + a documented name heuristic. Imperfect placements are expected and
   accepted — see `scripts/README.md`.

## Why

- Reuses a pipeline, a licensing stance (ADR 0002) and a runtime service the app
  already has.
- Slug ids make a Fan API refresh a non-event for saved player data.
- Offline-first is preserved: icons are committed, not hot-linked.

## Consequences

- **Base game only.** The Fan API predates *Shadow of the Erdtree*; so does the
  catalog, matching the map's scope.
- **Coverage gaps.** Anything the Fan API omits (e.g. Bell Bearing items) is
  absent. Category placement is heuristic for the `items` resource.
- ~1,800 committed icons (~3–6 MB) under `src/assets/items/<resource>/`. This
  roughly doubles the repo's image payload; the tile pyramid is still far larger.
- A re-fetch that renames an item orphans its saved inventory / loadout entry.
  Near-static data, one lost row — acceptable, same position as ADR 0003.
