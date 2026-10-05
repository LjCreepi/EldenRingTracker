# Elden Ring Tracker

An unofficial fan tool for tracking personal progress through *Elden Ring* against an
interactive map of the game world. This context covers the map and its markers; more
tracking features will follow.

## Language

### Map

**Map Layer**:
A distinct, self-contained surface of the game world with its own imagery and its own
coordinate space. Surface (the Lands Between) and Underground exist now; Realm of Shadow
(the *Shadow of the Erdtree* DLC) comes later. Layers are switched between one at a time,
never stacked or overlaid.
_Avoid_: level, floor, zone, region

**Marker**:
A single point of interest positioned on one Map Layer. Belongs to exactly one Marker
Category and comes from the Marker Catalog. A Marker is the same for every user.
_Avoid_: pin, point, node

**Marker Catalog**:
The complete, versioned, read-only set of Markers, shipped with the app as a static
asset. Users do not add to or edit the Catalog (in the current scope).
_Avoid_: dataset, marker list, database

**Marker Category**:
A kind of Marker — bosses, sites of grace, dungeons, merchants, golden seeds, and so
on. Every Marker has one. A Category declares whether its Markers are *completable*,
and is the unit shown or hidden from the menu. Some Categories start hidden until the
user switches them on.
_Avoid_: type, layer, label

**Category Group**:
A labelled, collapsible section in the menu that clusters related Marker
Categories together (*Golden Seeds & Sacred Tears*, *Upgrade Materials*,
*Consumables & Kit*). Purely visual: collapsing a Group only hides its rows from
the menu — it has no visibility toggle of its own, and every Category inside it is
switched on and off independently. A Category need not belong to a Group.
_Avoid_: filter, folder, layer

**Dungeon**:
A minor, self-contained location — a catacomb, cave, tunnel, hero's grave or
shunning-grounds. One Marker per Dungeon, placed at its interior Site of Grace (no
separate entrance coordinates exist in the source data). Legacy dungeons like
Stormveil Castle are whole areas, not Dungeons.
_Avoid_: lair, instance, level

**Merchant**:
One of the wandering merchants (Nomadic, Hermit, Isolated, …) that a player hunts for
Bell Bearings. A Merchant is *found* (its completion) and may then have its Bell
Bearing claimed (a Bonus Step). Named quest-NPC vendors are not Merchants.
_Avoid_: vendor, shop, NPC

**Tile Pyramid**:
The raster imagery of one Map Layer, cut into `{z}/{y}/{x}` webp tiles across zoom
levels 0–6 over a 10496² master. Vendored from `elden-ring-compass` into
`src/assets/map-tiles/`. One Pyramid per Layer.
_Avoid_: tileset, sprite sheet, texture

**Tile Index**:
The generated record of which tiles of a Tile Pyramid actually exist on disk, per
Layer, so the map never requests a tile that isn't there. Shipped as
`map-tiles-index.json`.
_Avoid_: manifest, tile list, atlas

**Offline Tile Cache**:
The one-time-per-catalog-version warm-up that pulls every tile of both Tile Pyramids
(surface and Underground) into the service-worker cache, so the map still works with
no connection. The user may dismiss the Map Preparing screen, but the download itself
runs to completion in the background — dismissing only hides the UI, it does not stop
the warm-up. A warm-up that never finished (tab closed) retries on the next launch.
_Avoid_: preload, download, sync

**Map Preparing**:
The dismissible corner chip shown while the Offline Tile Cache warms — on the
first run (behind the Onboarding Wizard) and for later catalog-version updates
alike. Dismissing only hides the chip; the download runs on regardless. The app
is usable throughout. (Through 0.4.0 the first run was a blocking full-screen
splash; the app intro it carried now lives in the Onboarding Wizard.)
_Avoid_: splash, loader, spinner

### Progress

**Character**:
A single save / run of the game that a user is tracking. Has a name and a fixed
starting Class — both chosen when the Character is created — and owns that run's
Completion records, its Inventory, its Loadout and its Character Sheet. One user
may track several Characters and switches between them; there is always at least
one. The name is stored exactly as typed but is only ever shown as a Censored
Name.
_Avoid_: playthrough, save slot, profile, game

**Censored Name**:
A Character's name as displayed anywhere in the app: the raw name with a small,
deliberately partial set of substrings masked by asterisks (so "Knight" shows as
"K\*\*\*ht"). A nod to *Elden Ring*'s own name filter, not a reproduction of it
(see docs/adr/0007). Display only — the raw name is what is stored and what the
Mirror edits.
_Avoid_: display name, filtered name, nickname

**Mirror**:
The rename affordance on the Status screen — a small mirror icon beside the name,
after the one in Fia's room at the Roundtable Hold. The only way to rename a
Character once it exists.
_Avoid_: rename button, edit-name field

**Completion**:
A record, belonging to one Character, that a specific completable Marker has been dealt
with — a boss defeated, an item collected, a grace discovered, a merchant found.
Completion is progress and is what the menu counts.
_Avoid_: check, done flag, visited

**Bonus Step**:
An optional follow-up on a Marker, tracked as its own Completion record but *not*
counted as progress — currently only a Merchant's Bell Bearing. A Marker with a done
Completion and an open Bonus Step carries a small flag on its map pin.
_Avoid_: sub-task, phase, half-step

**Category Visibility**:
A per-user view preference: whether a Marker Category's Markers are currently drawn on
the map. A display setting, not progress, and not tied to a Character. Stored as the
explicit on/off choices the user has made; a Category with no choice follows its
default (most on, some — see Marker Category — off).
_Avoid_: toggle state, filter

### Character sheet & inventory

**Item**:
A single kind of obtainable thing in *Elden Ring* — a weapon, a talisman, a
cookbook, a Smithing Stone. Comes from the read-only Item Catalog and is the same
for every user. An Item is a *thing you can own*; a Marker is a *place on the map*
— the two are tracked independently (see docs/adr/0004).
_Avoid_: good, object, entry

**Item Catalog**:
The complete, versioned, read-only set of Items with their in-game data and icons,
shipped with the app as a static asset. Derived at build time from the Elden Ring
Fan API. Base game only, and only as complete as that API. Users do not edit it.
_Avoid_: item list, database, item API, goods

**Item Asset Cache**:
The one-time-per-catalog-version warm-up that pulls every Item icon into the
service-worker cache on launch, shown as a small corner chip. Afterwards the
Character screens render straight from the cache and work offline; it re-runs
only when the catalog version changes. The item counterpart of the map's Offline
Tile Cache.
_Avoid_: preload, prefetch, icon sync

**Item Category**:
The bucket an Item sits in, mirroring *Elden Ring*'s own inventory tabs
(Consumables, Tools, Bolstering Materials, Sorceries, Melee Armaments, Head Armor,
Talismans, Spirit Ashes, …). Every Item has exactly one. Some are populated by a
best-effort heuristic where the Fan API's own typing is too coarse
(see scripts/README).
_Avoid_: item type, tab, kind

**Inventory**:
The set of Items a Character currently holds, each with a quantity the user enters
by hand. A live mirror of the player's in-game inventory — it goes up *and* down —
not a one-way completion checklist. An Item held in NG+ multiples is just a higher
quantity. Golden Seed and Sacred Tear are the one exception to "by hand": their
quantity also follows map Completion automatically (see "Golden Seed" / "Sacred
Tear") — the user can still adjust it directly on top of that.
_Avoid_: bag, stash, collection, backpack

**Loadout**:
The Items a Character has equipped, one per equipment slot — armaments (three per
hand), armour (four pieces), talismans (four), memorised spells, arrows and bolts,
one Great Rune, one Spirit Ash, an Ash of War per armament. One Loadout per
Character. An equipped Item need not be in the Inventory (the equip picker can
draw from the whole Catalog); one that isn't is flagged wherever it shows — in
the picker and on the Equipment screen itself.
_Avoid_: build, gear, equipment set, fit

**Character Sheet**:
A Character's eight Attribute values. The starting Class they build on top of
belongs to the Character, not the Sheet. Everything else on the status screen —
Level, HP, FP, stamina, equip load, poise, defences — is a Derived Stat computed
from the Sheet, the Class and the Loadout, not stored.
_Avoid_: stats, build, profile, character screen

**Attribute**:
One of the eight primary stats the player raises with runes: Vigor, Mind,
Endurance, Strength, Dexterity, Intelligence, Faith, Arcane.
_Avoid_: stat, skill, primary stat

**Derived Stat**:
A status-screen value computed rather than entered — HP, FP, Stamina, Equip Load,
Poise, Discovery, defences, resistances. Equip Load percentage and roll weight
are exact; the rest are *approximations* and the screen says so (see
docs/adr/0005). Attack Rating (below) is computed the same "not entered"
way but isn't one of these — it lives on the Equipment screen, not the
Status screen, and carries its own fidelity disclosure rather than the
blanket "≈".
_Avoid_: secondary stat, computed stat

**Attack Rating**:
An equipped armament's real combat power, computed per damage type from the
Item Catalog's base stats, the Character's (Wondrous-Physick-adjusted)
attributes, and its Armament Build — Upgrade Level, Upgrade Path, Affinity and
two-handing. Supersedes "Attack Power," which was never simulated (see
docs/adr/0005, superseded by docs/adr/0010 for this). Shown on the Equipment
screen next to the selected armament/shield, not the Status screen. Fidelity
is mixed and disclosed there, not by the "≈" marker: upgrade-level growth and
two-handing are verified against real per-weapon data; the attribute soft-cap
curve is a best-effort approximation; Affinity is tracked but doesn't change
the number yet.
_Avoid_: attack power, AR (fine in code/UI shorthand, spell it out in prose)

**Armament Build**:
The per-slot choices behind an equipped armament/shield's Attack Rating:
Upgrade Level (0–25 Standard, 0–10 Somber), Upgrade Path, Affinity, and
whether it's two-handed. Set on the Equipment screen; resets to a fresh
default whenever a *different* Item is equipped into that slot, since these
belong to the specific weapon, not the slot itself.
_Avoid_: loadout stats, weapon config

**Upgrade Path**:
Whether an armament is reinforced with ordinary Smithing Stones (Standard,
capped at +25) or Somber Smithing Stones (Somber, capped at +10) — a fixed
fact about that specific weapon in the game, not a free choice. The Item
Catalog doesn't carry this fact (see docs/adr/0010), so the app *guesses* a
default from a small hand-curated list of well-known Somber weapons and lets
the user correct it; an unlisted weapon defaults to Standard.
_Avoid_: reinforcement type, smithing path

**Affinity**:
An armament's infusion (Standard, Heavy, Keen, Quality, Fire, Flame Art,
Lightning, Sacred, Magic, Cold, Poison, Blood, Occult). Selectable for any
armament with no legality check (see docs/adr/0010) — tracked and shown, but
only Standard currently affects the computed Attack Rating.
_Avoid_: infusion (fine as a synonym in prose, but code/model uses Affinity)

**Class**:
One of the ten *Elden Ring* starting classes (Vagabond, Warrior, Hero, Bandit,
Astrologer, Prophet, Confessor, Samurai, Prisoner, Wretch). Fixes a Character's
base Attributes and starting Level. Chosen once, when the Character is created,
and never changed after — as in the game (see docs/adr/0006). Hardcoded — the
Fan API's class list is unreliable.
_Avoid_: origin, archetype, build, background

**Great Rune**:
One of the demigod runes a Character may have restored and equipped. One equipped
at a time; tracked as part of the Loadout.
_Avoid_: shardbearer rune, boss rune

### Flask

**Golden Seed** / **Sacred Tear**:
An Item collected on the map like any other — completing its Marker adds one to
Inventory automatically, un-completing removes one (Inventory always reflects
what's currently held; see docs/adr/0008). Separately, a held one may be *Used*
(see Flask Used Count) to permanently raise Flask Charges / Flask Potency —
mirroring reinforcing the Flask at a Site of Grace in-game. Collected and Used
are tracked independently: an Item can be held without being Used.
_Avoid_: turned in (it's a Grace mechanic, not an NPC hand-in)

**Flask Used Count**:
A Character-level counter — separate per Golden Seed and Sacred Tear — of how
many have been Used rather than merely collected. Adjusted by hand on the
Status screen (never by the map); capped so it can't exceed how many are
currently in Inventory. Drives Flask Charges and Flask Potency; unlike
Inventory quantity it only changes when the user deliberately Uses or un-Uses
one.
_Avoid_: seeds used, tear count

**Flask Charges** / **Flask Potency**:
Derived Stats on the Status screen: total Flask charges (Crimson + Cerulean)
and the Flask's healing-potency tier, computed from the Flask Used Count via a
community-documented cost table (see docs/adr/0008) — not from Inventory
quantity.
_Avoid_: flask level, flask upgrades

**Wondrous Physick**:
The flask mechanic that mixes two Crystal Tears into a temporary buff, drunk
once per rest. Modelled as the Physick Mix, set on the Equipment screen
alongside every other equip slot (see docs/adr/0009) — a genuinely separate
mechanic from the Golden Seed/Sacred Tear Flask stats above, which it does not
affect.
_Avoid_: physick, the flask (ambiguous with the Crimson/Cerulean flask itself)

**Crystal Tear**:
An Item that can be loaded into the Physick Mix, base game only (40 exist
with the *Shadow of the Erdtree* DLC; see CONTEXT.md → "Scope"). The Item
Catalog has no dedicated category for them — they land under `key-items` or
`consumables` depending on the Fan API's own classification — so a hand-curated
id list (`CRYSTAL_TEAR_ITEM_IDS`) is what the Physick Mix picker and the
numeric-effect table both key off (see docs/adr/0009).
_Avoid_: tear (ambiguous with Sacred Tear / Golden Seed)

**Physick Mix**:
A Character's two chosen Crystal Tear slots, plus whether the mix is marked
*Active*. Active is a manual toggle with no real timer — turning it on
previews the mix's effect (an attribute change, where modelled) against the
Character's stats without simulating drinking it or a duration expiring.
_Avoid_: loadout (it's equip-shaped but tracked separately from Loadout)

### Onboarding

**Onboarding Wizard**:
The first-run flow: a short intro to what the app is, then Character creation
(class, then name). Skippable — skipping takes the default Character, a Vagabond
named "Tarnished". Shown once, tracked by the app version it was last finished
at, and re-openable (intro only) from the About screen. If the last Character is
ever deleted it reappears at the creation step alone, with no skip.
_Avoid_: tutorial, setup, splash, wizard

**What's New**:
A one-time note shown after the app updates to a version that has player-facing
highlights recorded for it, listing them in plain terms. Separate from — and
written independently of — the developer changelog.
_Avoid_: changelog, patch notes, release notes

## Working agreements

Not glossary — process notes for anyone (human or Claude) working in this repo.

### UI components

**Build screens from Ionic components** (`ion-list`, `ion-item`, `ion-grid` /
`ion-row` / `ion-col`, `ion-card`, `ion-button`, `ion-text`, `ion-badge`,
`ion-thumbnail`, `ion-infinite-scroll`, …) rather than bare `div` / `section` /
`span` / `p`. A bare element is used only where Ionic genuinely has no
equivalent — a CSS-grid tile layout, or a plain `<p>` / `<h2>` inside `ion-text`
/ `ion-label` (Ionic has no `ion-paragraph`). Where that happens, leave a
one-line comment saying why.

### Versioning

**Never cut a new version unless explicitly told to.** "Bump the version",
"release 0.2.0", "cut a release" — an explicit instruction like that is the only
trigger.

The canonical changelog is `../CHANGELOG.md` at the repo root; `CHANGELOG.md`
in this folder is a working copy. Fold it into the root file before releasing.
This folder's changelog is split: `CHANGELOG.md` is an index (the `[Unreleased]`
section plus a linked list of releases), and every released version has its own
file under `changelog/X.Y.Z.md`.
Update (`core/onboarding/release-notes.ts`) to now include new Features.

Between releases:

- All changes accumulate under `## [Unreleased]` in `CHANGELOG.md`.
- `package.json` `version` and `src/environments/environment{,.prod}.ts` `version`
  stay untouched.
- **`store/listing.md` is a living document.** Whenever a user-facing thing
  changes — a feature, a screen, a screenshot, the disclaimer — update
  `store/listing.md` in the same commit. It follows Google Play field conventions
  (character limits noted per field); adapt for other stores as needed. It is a
  draft until the app is actually submitted somewhere.

When told to cut version `X.Y.Z`:

1. Set `version` in `package.json`, `src/environments/environment.ts`, and
   `src/environments/environment.prod.ts` to `X.Y.Z`.
2. In the root `CHANGELOG.md`, rename `## [Unreleased]` to
   `## [X.Y.Z] — <today, ISO>` and add a fresh empty `## [Unreleased]` above it.
3. In this folder, move the `## [Unreleased]` notes from `CHANGELOG.md` into a
   new `changelog/X.Y.Z.md` titled `# X.Y.Z — <today, ISO>`, add a link row for
   it under `## Releases` in `CHANGELOG.md`, and reset `## [Unreleased]` to
   empty.

The `version` field inside `marker-catalog.json` is a **data** version (a content
hash written by `scripts/prepare-map-assets.mjs` — it changes only when the
generated marker / tile data changes), independent of the app's SemVer. Don't
touch it by hand.

### Map assets

`src/assets/data/*.json` and `src/assets/map-tiles/` are generated / vendored.
The catalog JSON is regenerated by `npm run prepare:map` (runs automatically on
`npm start`). See `scripts/README.md`. Don't hand-edit the generated JSON.
