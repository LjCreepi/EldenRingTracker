# Map imagery and marker data from a fan project

## Context

The interactive map needs a raster of the game world plus positioned, categorised
markers (bosses, sites of grace, dungeons, golden seeds and sacred tears,
merchants). Producing these from scratch means extracting and stitching map
textures from an installed copy of the game and hand-placing hundreds of markers —
days of work. The community project `EthanShoeDev/elden-ring-compass` already has
tiled imagery and categorised marker data in a consistent coordinate system.

## Decision

Reuse the committed map tile pyramid from `elden-ring-compass` as-is
(`src/assets/map-tiles/`, `{z}/{y}/{x}` webp, 10496² master). Derive marker
positions ourselves at build time (`scripts/prepare-map-assets.mjs`) from the
game's MSB world coordinates in that project's generated data, projected with the
affine ported from its `map-affine.ts`. Output is our own schema
(`{ id, categoryId, layer, x, y, name }`), self-hosted alongside the app.

The coordinate derivation is documented in full in
[docs/map-coordinates.md](../map-coordinates.md).

## Why

- Saves several days and gives a coherent coordinate system for free.
- The alternative (self-extraction) carries the same copyright position as reusing
  the fan project's output, for far more effort.

## Consequences

- The map imagery and underlying data are © FromSoftware / Bandai Namco. There is
  no openly licensed Elden Ring map. This is tolerated only for non-commercial fan
  use.
- Mitigations: assets are self-hosted (not hot-linked), the app carries no ads and
  is not monetised, and every surface that shows the map states that it is an
  unofficial fan project not affiliated with FromSoftware or Bandai Namco, made
  for educational purposes — in the About page and in the Leaflet attribution
  control.
- We depend on a point-in-time copy of the fan project's data and tiles; updates
  must be re-pulled and re-run through `prepare-map-assets.mjs` deliberately. The
  compass-data inputs (`tempAssets/compass-data/*.ts` — `bosses`, `graces`,
  `markers`, `world-map-legacy-conv`, and `placements` + `goods` for the
  collectible categories) are committed so the catalog can be regenerated anywhere
  and `npm start` can run the script; the raw tile-pyramid source
  (`tempAssets/maps/`) is git-ignored because it is large and the served tiles are
  already committed under `src/assets/map-tiles/`. The processed output is
  committed. Production builds do not run the script.
- Marker icons under `src/assets/markers/` are the game's own map-UI sprites,
  sliced (the same set `elden-ring-compass` uses); the source sheets are in
  `tempAssets/icons/` and `tempAssets/icon-atlas/`. Same copyright position as the
  tiles — FromSoftware assets, non-commercial fan use.
- `npm run fetch:images` additionally pulls collectible icons and boss
  screenshots from the **Elden Ring Fan API** (`eldenring.fanapis.com`) into
  `src/assets/markers/` and `src/assets/marker-images/`. Manual, network-only,
  output committed — a normal build never calls it, so `prepare:map` and the
  build stay offline. The images are FromSoftware assets served by a community
  API; same non-commercial position, credited in About.
- That script is the only user of `sharp` (downscaling). `sharp` is a
  `devDependency`, but `npm ci` still installs it — and downloads its
  platform-specific native binary — in every CI job (`test_app`, `build_app`),
  none of which run `fetch:images`. Accepted: the CI `node_modules/` cache is
  keyed on `package-lock.json`, so the download only recurs when the lock file
  changes. Revisit (move to `optionalDependencies`, or a separate install) only
  if CI install time becomes a problem.
- `elden-ring-compass` ships **no licence file** — its code is therefore
  all-rights-reserved. We reimplement its projection maths (not copyrightable) and
  reuse its tiles + game-derived data (FromSoftware assets either way). We credit
  it prominently in About. Revisit before any non-personal distribution.
