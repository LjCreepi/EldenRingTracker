# Changelog

All notable changes to this project are documented here. Newest first.

## [0.6.0] — 2026-09-11

### Added

- **Weapon Attack Rating.** The Equipment screen now computes a real Attack
  Rating for the selected armament/shield from Upgrade Level, Upgrade Path
  (Standard/Somber), Affinity and Two-Handing — not just the catalog's static
  base values. Fidelity is mixed and disclosed inline: upgrade-level growth
  and two-handing are verified against real per-weapon data, the attribute
  soft-cap curve is a best-effort approximation, and Affinity is tracked but
  doesn't change the number yet (see docs/adr/0010).
- **Wondrous Physick.** Pick two Crystal Tears into a Physick Mix on the
  Equipment screen, toggle it Active, and preview its effect (where modeled)
  against your attributes and Attack Rating.
- **Golden Seed / Sacred Tear tracking.** Completing their map markers now
  adds the Item to Inventory automatically. The Status screen tracks how many
  have actually been *Used* (vs. just collected) and shows the resulting
  Flask Charges / Flask Potency.

### Fixed

- The item-detail panel's "scaling not simulated" note, stale since Attack
  Rating started being simulated, is removed from weapon stat blocks.

## [0.5.5] — 2026-09-11

### Fixed

- **The docked marker detail panel (tablet/desktop) showed a stale completion
  label after switching markers without closing it** — the panel reuses the
  same component instance across marker switches, and the completion-label
  logic was accidentally memoized so it never picked up the new marker.

### Changed

- Internal cleanup: removed dead code and a duplicated dependency,
  deduplicated the cache services and data-prep scripts, and split several
  high-complexity templates into smaller components. No user-visible change
  beyond the fix above.

## [0.5.4] — 2026-09-11

### Fixed

- **Two "preparing" status chips (map tiles, item art) could land exactly on
  top of each other on the Map page, unreadable.** Both are fixed to the same
  corner; the second one now stacks above whichever is already showing.
- **The map layer switch ("Lands Between" / "Underground") clipped to
  unreadable fragments** ("LANDS BET…", "UNDERGR…") — in the map toolbar at
  landscape-phone/small-tablet widths (~768–900px, where it's the *only* way
  to switch layers), and separately in the side menu's copy on phones. Both
  now fit their full labels.
- **The "— a safe pick if you're unsure" hint on class selection clipped to
  "…"** at narrow widths. It now sits on its own wrapping line.
- **The service-worker update prompt was a German browser dialog** — the only
  non-English string and the only native dialog anywhere in the app. Replaced
  with an English alert, matching every other confirmation in the app.
- **Inventory rows gave no visual cue that tapping the name opens the item's
  detail pane.** Restored the chevron Ionic normally shows, matching the side
  menu's character row.
- **The Bonus Step flag on a completed marker (e.g. a found merchant's
  uncollected Bell Bearing) was an unlabeled amber dot, explained nowhere in
  the app.** It's now an actual flag glyph, explained on the About page and
  folded into the marker's screen-reader label.
- **Dismissing a "preparing" chip didn't say it leaves the download
  running** — that was only in the screen-reader-only label. Added a visible
  line saying so.
- **New players had no way to learn that most marker categories start
  switched off** (10 of 14, including Golden Seeds and Crystal Tears). Added a
  line to onboarding and a hint under the side menu's "Markers" header.

Found during a manual pass across desktop, mobile-portrait and
mobile-landscape viewports, alongside a UI-instructiveness review.

### Docs

- `store/listing.md`'s About screenshot recaptured — it was two versions
  stale and missed the new "Map symbols" section.

## [0.5.3] — 2026-09-11

### Fixed

- **The docked side menu could get stuck permanently hidden on phones.** The
  CSS that hides the menu when collapsing the docked layout targeted a class
  Ionic assigns once and never removes, instead of the one that tracks
  whether the menu is actually docked. A phone wide enough in landscape to
  dock the menu, collapsed there, then rotated back to portrait, was left
  with the now-overlay menu forced hidden — unreachable from the hamburger
  button, with no way back in.

### Docs

- `store/listing.md` — filled in the six remaining screenshot rows
  (create-character, status, settings, about, equipment, inventory) and
  refreshed `map-desktop`/`map-mobile` to match; all now dark-mode captures.

## [0.5.2] — 2026-09-11

### Fixed

- **Screen readers announced every map pin as a bare "button".** Leaflet
  renders each marker as `role="button"` with no accessible name; pins are now
  labelled with the marker's name.
- **The page couldn't be pinch-zoomed** — the viewport meta tag disabled it
  (`user-scalable=no`). Removed; the map still owns its own pinch/scroll zoom.
- **The side menu's ARIA list structure was invalid** — a "Hide" button lived
  inside the list's header, and collapsible group headers used
  `role="button"`, both illegal children of a `role="list"`. The header now
  sits outside the list, and group headers are real `<ion-item button>` rows.

Found via a Lighthouse accessibility audit; Accessibility now scores 100/100
on both the mobile and desktop presets (was 90/87).

## [0.5.1] — 2026-09-10

### Fixed

- The **"What's New"** note (new in 0.5.0) rendered as a tiny box with one
  clipped line and a stray scrollbar — an inline `<ion-modal>` collapsing its
  content. It's now a compact centred card that shows all of its text.

### Docs

- `store/listing.md` caught up to 0.5.0 — character creation, the locked-in
  class, switching characters, and the Equipment not-owned markers.

## [0.5.0] — 2026-09-10

Multiple characters — create them, name them, switch between them — with the
starting class locked in at creation, and a first-run wizard that walks you
through it.

### Added

- **Character creation & switching.** A character has a name and a starting
  class, both set when it's created. A character bar at the top of the side menu
  opens a **Characters** screen to switch, create or delete (type the name to
  confirm a delete; it clears that character's map progress, inventory, loadout
  and sheet).
- **Onboarding Wizard** — first run gives a short app intro, then character
  creation; skippable (Skip takes a Vagabond named "Tarnished"), re-openable from
  About. Reappears at the creation step if the last character is deleted.
- **Rename via the mirror** — the Furled Finger's Trick-Mirror talisman on the
  Status screen, an *Elden Ring* nod, and the only way to rename a character.
- **"What's New"** note after an app update — hand-written player-facing
  highlights per version.
- **Name filter** — names cap at 16 characters and display through a small,
  deliberately partial censor ("Knight" → "K\*\*\*ht"); stored and usable as
  typed (`projekt/docs/adr/0007`).

### Changed

- **Class is locked at character creation** (`projekt/docs/adr/0006`) — the
  Status screen shows it read-only now; `classId` moved from the Character Sheet
  onto the Character, and existing saves migrate on load.
- The app shell mounts from the first frame with the wizard as an overlay (so the
  map is ready as soon as the wizard closes); the first-run map download is a
  dismissible corner chip, not a blocking splash. `MapPreparingComponent` folded
  into the shared `PreparingChipComponent`.

### Fixed

- The **Equipment** loadout view now flags every equipped item that isn't in
  your inventory — a corner marker on the slot, an amber Ash-of-War button, a
  note on memorised spells, a banner in the detail column. Previously only the
  equip picker showed it.

### Docs

- `projekt/CONTEXT.md` — **Character**, **Character Sheet**, **Class**, **Map
  Preparing** rewritten; new terms **Censored Name**, **Mirror**, **Onboarding
  Wizard**, **What's New**.
- `projekt/docs/adr/0006` (class locked at creation), `0007` (the name filter is
  a token, not FromSoftware's).

## [0.4.0] — 2026-09-10

The Character menu: an Inventory kept by hand, an Equipment loadout built from a
~1,900-item catalogue, and a Status sheet — all styled after the in-game screens.

### Added

- **Character menu** — three side-menu screens:
  - **Inventory** — a by-hand mirror of what the active Character holds. Each
    item has a quantity (the ＋ on a row bumps it); **Add items** opens a catalog
    browser with a "hide items I already hold" filter. Tabs follow the game's
    inventory categories.
  - **Equipment** — the three-column layout: slot grid (armaments ×6, armour ×4,
    talismans ×4, arrows/bolts, spirit ash, great rune, an Ash of War per
    armament, a memorised-spell list), the selected item's stats in the middle,
    and a live Character Status panel. The equip picker defaults to your
    inventory with a toggle for the whole catalog; anything equipped you don't
    hold is flagged.
  - **Status** — the editable sheet: pick one of the 10 starting classes, raise
    the eight attributes, see Level and the derived stats. Equip Load % and roll
    weight are exact; HP/FP/stamina and the rest are approximations and the
    screen says so (`projekt/docs/adr/0005`). Weapon Attack Rating is not
    simulated.
- **Item Catalog** — `scripts/fetch-item-catalog.mjs` (manual, online, output
  committed, like `fetch:images`) builds `item-catalog.json` (~1,900 items) and
  64 px icons under `src/assets/items/<resource>/` from the Elden Ring Fan API.
  Base game only. See `projekt/docs/adr/0004`.
- **Item icons warm into the cache on launch** (`ItemAssetCacheService`), shown
  as a small corner chip — once per catalog version, then the Character screens
  render from cache and work offline. Same mechanism as the map tile warm-up.
- **Settings → Reset** — three buttons, each scoped to the active Character:
  *map progress*, *inventory & character sheet*, *everything*.
- The Character screens stack their columns on narrow viewports, behind one
  revertable flag (`COMPACT_CHARACTER_LAYOUT`).

### Changed

- The **Add items** list is paged behind an infinite-scroll (40 rows at a time)
  instead of rendering all ~1,900 at once — the button no longer lags.
- The Character screens are built from Ionic components throughout
  (`ion-grid`/`ion-row`/`ion-col`, `ion-card`, `ion-list`, `ion-infinite-scroll`,
  …) — now a working agreement in `projekt/CONTEXT.md` → "UI components".

### Fixed

- **The page itself no longer zooms** on double-tap, two-finger pinch, or
  Ctrl+wheel — only the map zooms. Per-gesture guards, since no single setting
  covers every browser (iOS Safari ignores `user-scalable=no`).

### Docs

- `projekt/CONTEXT.md` — new glossary section (Item, Item Catalog, Item Asset
  Cache, Inventory, Loadout, Character Sheet, Attribute, Derived Stat, Class,
  Great Rune) and the "UI components" working agreement; the **Character** term
  now owns the inventory, loadout and sheet.
- `projekt/docs/adr/0004` (item catalog from the Fan API, own slug ids),
  `0005` (character stats are approximated; Attack Rating is a stub).
- README shows the new tabs; a "Planned, not yet built" section (weapon upgrade +
  affinity + real AR, crafting, gestures data, save-file import, DLC).

## [0.3.0] — 2026-09-04

Doc/course-requirement polish, a collapsible side menu, and a first pass at a
genuinely different tablet/desktop layout (not just resized).

### Added

- **Collapsible menu groups** and an **"All markers" toggle** in the side menu.
- **Collapse the side menu** on tablet/desktop — a "Hide" button in the menu
  header, a matching toolbar button to bring it back (`menuDocked` preference).
- **Guide text on the first-run map-preparing screen**, including an explicit
  note that "Continue now" doesn't stop the tile download — it keeps saving the
  map in the background so offline access still works.
- **App-store listing** — `store/listing.md` (draft).
- **Responsive layout now visibly differs, not just resizes**
  (`projekt/docs/responsive.md`): the Surface/Underground layer switch moves
  into the map toolbar on tablet+/desktop (phones keep it in the menu); marker
  detail opens as a **docked side panel** on tablet+/desktop instead of a
  popover (phones keep the popover); an overall completion card appears on the
  map, tablet+/desktop only.

### Changed

- Web app manifest completed (`id`, `description`, `lang`, `dir`, `orientation`,
  `theme_color`/`background_color`, `categories`); the PWA chrome colour now
  follows the active colour scheme.
- Side-menu breakpoint pinned explicitly (`ion-split-pane when="md"`).
- `prepare:map`'s catalog `version` is now a content hash instead of a per-run
  date stamp, and the script only writes a file when its content changed.
- CI `test_app` now also runs `npm run lint`.
- Removed the unused Capacitor scaffold — the app is browser-PWA only.
- Offline tile warm-up (surface + Underground) now always runs to completion
  even if "Continue now" is used to stop waiting for it.

### Fixed

- Removed a duplicated `<link rel="manifest">` from `index.html`.
- Marker-detail popover no longer resizes/repositions itself mid-interaction
  when marking something done/undone — it closes on the action instead. The
  docked side-panel variant never had the problem.

### Docs

- README marker counts refreshed (~740 across 14 categories); noted the app is
  PWA-only; boss-image match coverage (86/112) now recorded and regenerated by
  `scripts/fetch-marker-images.mjs`; `docs/adr/0002` notes `sharp`'s CI cost;
  removed a duplicate agent-skills tree (`.agents/`).

## [0.2.0] — 2026-09-04

Dungeons, merchants and ten collectible categories on the map, a grouped marker
menu, and authentic imagery from the Elden Ring Fan API.

### Map markers

- **Dungeons** (~40) — every minor dungeon (catacomb, cave, tunnel, hero's grave,
  shunning-grounds), placed at its interior Site of Grace. Single "cleared" tick.
- **Merchants** (~20) — the wandering merchants. Two-part tracking: *found* is the
  completion; *Bell Bearing claimed* is an optional bonus step that isn't counted,
  and a found merchant without its bell bearing shows a small flag on its pin.
- **Ten collectible categories** derived from Elden Ring's own item-placement data
  (`placements.ts` + `goods.ts`, vendored from elden-ring-compass): Golden Seeds,
  Sacred Tears, Larval Tears, Memory Stones, Talisman Pouches, Crystal Tears,
  Whetblades, Bell Bearings, Cookbooks, Gloveworts. Guaranteed pickups only;
  DLC-only locations are skipped (no DLC tiles yet).

### Marker menu

- **Groups** — categories can sit under a labelled section (*Golden Seeds &
  Sacred Tears*, *Upgrade Materials*, *Consumables & Kit*). Visual only: no group
  toggle, every category still switches on its own.
- **Default-hidden categories** — the ten collectible categories start off; turn
  on the ones you want. Visibility is stored as explicit on/off choices
  (`shownCategories` / `hiddenCategories`), so a category added later stays hidden
  until opted in.

### Imagery — `npm run fetch:images` (Elden Ring Fan API)

- Authentic in-game icon for each collectible category (Bell Bearings excepted —
  the API has no such item; a hand-placed `bell-bearings.png` overrides it).
- Boss screenshot for ~120 boss markers, shown in the detail popover.
- Every image is downscaled with `sharp` before it's committed (icons 128 px,
  boss shots 500 px) — ~1.5 MB total. Manual, network-only, output committed; a
  normal build never runs it.

### Schema & build

- `marker-catalog.json` v2: `groups`, plus `group` / `defaultHidden` /
  `bonusStep` on a category and `image` on a marker. See
  `projekt/docs/adr/0003-marker-catalog-schema-v2.md`.
- `projekt/docs/map-coordinates.md` documents the dungeon, merchant and
  placement-based derivations; `projekt/docs/adr/0002` amended for the new
  vendored inputs and the Fan API.
- `sharp` added as a devDependency (used only by `fetch:images`).
- `src/test-setup.ts` now points `localStorage` at jsdom's Storage when the Node
  runtime shadows it with an inert experimental global (Node 26).

## [0.1.1] — 2026-09-04

### Fixed

- **Marker clustering crashed in production builds** (`X.markerClusterGroup is
  not a function`). `leaflet.markercluster` augments a free `L` global, but
  esbuild's CJS interop hands our `import * as L from 'leaflet'` a re-wrapped
  namespace that isn't the object the plugin patched — so `L.markerClusterGroup`
  was missing. The dev server's dependency pre-bundling hid it. Fixed by binding
  Leaflet to `globalThis.L` before the plugin loads
  (`src/app/core/map/leaflet.ts`); import `L` from there, never from `'leaflet'`.

## [0.1.0] — 2026-09-03

First release. Interactive map of the Lands Between with real marker data,
per-character progress tracking, and offline support.

### Map

- **Interactive map** of the Lands Between: pan and zoom, Leaflet with
  `CRS.Simple`. Surface and Underground layers, switched one at a time.
- **Map imagery** is the tile pyramid from `EthanShoeDev/elden-ring-compass`
  (`{z}/{y}/{x}` webp, 10496² master, zoom 0–6). Leaflet `TileLayer` with an
  on-disk existence index (`map-tiles-index.json`) so missing tiles are never
  requested.
- **Markers**: 313 Sites of Grace and 155 Bosses, positioned from the game's own
  MSB world coordinates (projected via the affine ported from elden-ring-compass).
- **Marker clustering** (`leaflet.markercluster`) — pins collapse into counted,
  per-category clusters that split as you zoom in. Toggle in Settings.
- **Offline map**: every tile is warmed into the service-worker cache once per
  catalog version. First run shows a blocking "Map Preparing" splash with
  progress; later data updates warm in the background with a dismissible chip.
  The warm-up is skippable and the skip is not remembered.

### Progress

- **Completion tracking**: tap a marker → popover → mark as done / not done.
  Completed markers are dimmed with a check badge. Per-category `done / total`
  counts in the menu.
- **Character model**: progress is stored per Character; one is auto-created.
- **Category Visibility**: per-category show / hide from the side menu.

### App

- **Settings**: two colour schemes (Erdtree, Ash), light / dark / follow-system,
  marker clustering toggle, reset progress.
- **Persistence**: progress and preferences saved to `localStorage`.
- **Pages**: Map, Settings, About (with the fan-project disclaimer).
- **PWA**: installable, Angular service worker, in-app update prompt.
- Unit tests for the state services and map logic.

### Build

- `npm run prepare:map` turns the raw `tempAssets/` data into the two shipped
  JSON assets (`marker-catalog.json`, `map-tiles-index.json`). Runs automatically
  before `npm start`. See `projekt/scripts/README.md`.

### Project docs

- `projekt/CONTEXT.md` — domain glossary + working agreements (incl. the
  versioning rule).
- `projekt/scripts/README.md` — the `prepare:map` runbook.
- `projekt/docs/adr/0001` — local-only, no backend.
- `projekt/docs/adr/0002` — map assets from a fan project + licensing stance.

### Not yet

- Dungeons, Golden Seeds & Sacred Tears, Merchants — need marker classification
  work on the raw entity data.
- DLC (Land of Shadow) layers.
- Accounts + cross-device sync.
