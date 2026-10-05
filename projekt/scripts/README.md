# scripts

## `prepare-map-assets.mjs`

Turns the raw data in `tempAssets/` into the two static assets the app ships:

| Output | What it is |
| --- | --- |
| `src/assets/data/marker-catalog.json` | Every marker positioned in master-pixel space, plus category + group metadata. Carries a `version` content hash — see below. |
| `src/assets/data/map-tiles-index.json` | Which `{z}/{y}/{x}` tiles actually exist on disk, per layer, so the map never requests a missing tile. |

Categories in the catalog:

| From | Categories |
| --- | --- |
| `bosses.ts` / `graces.ts` (curated name lists) | `bosses`, `sites-of-grace` |
| `graces.ts` (minor-dungeon interior graces, deduped per map block) | `dungeons` |
| `markers.ts` (`npc` entries named `*Merchant*`) | `merchants` |
| `placements.ts` filtered by item id / name / category via `goods.ts`, guaranteed pickups only, deduped by pixel | `golden-seeds`, `sacred-tears`, `larval-tears`, `memory-stones`, `talisman-pouches`, `crystal-tears`, `whetblades`, `bell-bearings`, `cookbooks`, `gloveworts` |

### What it's for

The map needs positioned markers and a tile-existence index. Rather than
hand-place hundreds of markers, we derive their positions from Elden Ring's own
MSB world coordinates (shipped in `EthanShoeDev/elden-ring-compass`'s generated
data) and project them with the affine ported from that project.

- **[docs/map-coordinates.md](../docs/map-coordinates.md)** — the full coordinate
  derivation: the affine, the legacy-area translation, the grace→entity
  indirection, a worked example, and the limitations.
- **[docs/adr/0002](../docs/adr/0002-map-assets-from-fan-project.md)** — the "why"
  and the licensing stance.

### Inputs

```
tempAssets/
  compass-data/*.ts   bosses, graces, markers, world-map-legacy-conv,   — COMMITTED
                      placements, goods
  maps/               raw tile pyramid source                           — git-ignored
```

`compass-data/` is committed so the catalog can be regenerated anywhere (and so
`npm start` can run this script). The raw tile source under `maps/` is large and
is **not** committed — the tiles the app actually serves already live in
`src/assets/map-tiles/`. Re-pull both from `elden-ring-compass` deliberately when
you want newer data.

### When to run it

- After re-pulling `tempAssets/compass-data/` (new/changed markers).
- After re-pulling the tile pyramid into `src/assets/map-tiles/` (so the index
  and the `version` stamp catch up).

It runs **automatically before `npm start`** (`prestart` in `package.json`). It
writes each output file only when its bytes actually change, so a run on an
unchanged checkout is a no-op and never shows up in `git status`.

It is **not** run by `npm run build` / `build:prod` — production builds ship the
committed JSON unchanged, so a deploy is deterministic and doesn't depend on
`tempAssets/` being present.

```bash
npm run prepare:map      # manual run
```

### How the `version` stamp drives offline caching

`marker-catalog.json`'s `version` is a **content hash** over the markers, the
category / group metadata and the tile index (prefixed `d…`). It is not the
app's SemVer. It changes when — and only when — the generated data changes, so
re-running the script without re-pulling `tempAssets/` leaves it untouched.

`MapTileCacheService` warms every tile into the service-worker cache once per
`version`. When the data changes the `version` changes, so on the next app launch
the warm-up runs again and re-`fetch()`es each tile URL. The Angular service
worker's `map-tiles` group is `installMode: lazy` / `updateMode: lazy`: a tile
whose bytes changed in the deploy is re-fetched from the network on that request;
unchanged tiles are served from cache with no network. So re-running the script
(after new data) is what propagates changed tiles to already-installed clients.

## `fetch-marker-images.mjs`

Downloads marker imagery from the **Elden Ring Fan API**
(`eldenring.fanapis.com`) into committed assets:

| Output | What it is |
| --- | --- |
| `src/assets/markers/<category>.png` | Authentic in-game icon per collectible category, downscaled to 128 px. Bell Bearings excepted — the Fan API has no such item; drop a PNG at `src/assets/markers/bell-bearings.png` by hand and `prepare:map` picks it up. |
| `src/assets/marker-images/boss/<slug>.jpg` | One screenshot per matched boss name, downscaled to 500 px / JPEG q78. |
| `tempAssets/fan-api/boss-images.json` | Boss name → asset path. Read by `prepare-map-assets.mjs`, which sets `marker.image` on boss markers. |

Every image is resized with **`sharp`** before it's written, so the committed
assets stay small regardless of what the API serves. `sharp` is a `devDependency`
and only this script uses it — but `npm ci` still installs it (and downloads its
platform-specific native binary) in every CI job, including `test_app` and
`build_app` which never touch it. That cost is accepted: the CI `node_modules/`
cache keyed on `package-lock.json` means the download only happens when the lock
file changes. See [docs/adr/0002](../docs/adr/0002-map-assets-from-fan-project.md).

Unlike `prepare:map` this **hits the network**, so it is a manual step and its
output is committed — a normal build never runs it. Re-run when the imagery
should be refreshed, then run `npm run prepare:map` to fold the new
`boss-images.json` into the catalog.

```bash
npm run fetch:images
```

Boss name matching is fuzzy: exact → loose → prefix → trailing-clause fallback
(`", the …"` / `", <epithet>"`), each guarded against short / ambiguous hits.
Unmatched or oversized bosses simply show no image in the popover. Licensing:
same non-commercial fan-use position as the tiles.

The script rewrites the block below on every run — do not edit it by hand:

<!-- boss-image-coverage:start -->
**Boss art coverage:** 86 / 112 boss names matched (regenerated 2026-09-04 by `npm run fetch:images`).

Unmatched (fall back to the no-image popover):
- Abductor Virgin (Swinging Sickle)
- Astel, Naturalborn of the Void
- Base Serpent Messmer
- Battlemage Hugues
- Bols, Carian Knight
- Commander O'Neil
- Demi-Human Queen Gilika
- Demi-Human Queen Maggie
- Demi-Human Queen Margot
- Erdtree Burial Watchdog
- Erdtree Burial Watchdog (Sword)
- Golden Hippopotamus
- Loretta, Knight of the Haligtree
- Margit, the Fell Omen
- Miranda Blossom
- Misbegotten Crusader
- Misbegotten Warrior
- Morgott, the Omen King
- Nox Monk
- Patches
- Putrid Avatar
- Putrid Crystalian (Spear)
- Rennala, Queen of the Full Moon
- Roundtable Knight Vyke
- Sanguine Noble
- Stonedigger Troll
<!-- boss-image-coverage:end -->

The `trailing-clause fallback` was added to cut the miss count (confirmed: 84 →
86 matches on the run that added it). If a future `fetch:images` run reports
**fewer** than 86 matches, revert that step in `matchBoss`.

## `fetch-item-catalog.mjs`

Builds the **Item Catalog** the Character menu (Inventory / Equipment / Status)
runs on, from the **Elden Ring Fan API** (`eldenring.fanapis.com`):

| Output | What it is |
| --- | --- |
| `src/assets/data/item-catalog.json` | ~1,900 items — id (a name slug), name, category, description/effect, and whatever stat blocks the API had (weapon attack/scaling, armour negation, spell FP cost …). Content-hash `version`, prefix `i…`. |
| `src/assets/items/<resource>/<slug>.png` | One 64 px icon per item, downscaled with `sharp`, in a folder per Fan API resource (`weapons/`, `armors/`, `talismans/`, …) so the ~1,800 files stay navigable. ~124 items have no API image and fall back to `src/assets/items/placeholder.svg`. |

Like `fetch:images` it **hits the network**, so it is a manual step, its output is
committed, and a normal build never runs it. The catalog JSON is written *before*
the icons download and each `icon` is only set once its file exists, so a killed
run still leaves a valid catalog and re-running only fetches what's missing.

```bash
npm run fetch:items
```

**Base game only** — the Fan API predates *Shadow of the Erdtree*. Coverage is
also only as good as the API: e.g. it has no Bell Bearing items.

### Item → category is a heuristic

The Fan API types the `items` resource only as `Consumable` / `Reusable` /
`Misc` — far coarser than Elden Ring's inventory tabs. `classifyItem()` in the
script sorts them into `bolstering-materials` / `info` (cookbooks) / `key-items`
/ `crafting-materials` / `tools` / `consumables` by name and type. **Wrong
placements are expected** and acceptable for a tracker. Weapons split into
`melee-armaments` / `ranged-armaments` by their `category`; armour into the four
slots; everything else maps one resource → one tab. Gestures are a hardcoded
name list (the API has no gesture data). See
[docs/adr/0004](../docs/adr/0004-item-catalog-from-fan-api.md).
