/**
 * Builds the Item Catalog the Character menu (Inventory / Equipment / Status)
 * runs on, from the Elden Ring Fan API (https://eldenring.fanapis.com):
 *
 *   src/assets/data/item-catalog.json          every item + in-game data
 *   src/assets/items/<resource>/<slug>.png      64 px icon per item
 *
 * Every icon is downscaled with `sharp` (64 px, palette PNG) before it lands in
 * the repo. Like `fetch-marker-images.mjs` this **hits the network**, so it is a
 * manual step — its output is committed and a normal build never runs it.
 *
 *   npm run fetch:items
 *
 * The catalog JSON is written *before* the icons download, and each item's
 * `icon` is only set once its file actually exists on disk — so a killed run
 * still leaves a valid catalog (missing icons fall back to a placeholder), and
 * re-running only fetches what's absent.
 *
 * Base game only (the Fan API predates Shadow of the Erdtree). Item → category
 * placement is best-effort: see the CATEGORY notes below and scripts/README.
 * Licensing: same non-commercial fan-use position as the map tiles (ADR 0002).
 */
import {
  mkdirSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { writeIfChanged } from './lib/write-if-changed.mjs';
import { getAll as getAllFrom } from './lib/fan-api.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_OUT = join(root, 'src', 'assets', 'data');
const ICONS_OUT = join(root, 'src', 'assets', 'items');
const API = 'https://eldenring.fanapis.com/api';

const ICON_MAX_PX = 64;
const SANITY_MAX_BYTES = 25 * 1024 * 1024;
const DOWNLOAD_CONCURRENCY = 8;

// --- helpers -------------------------------------------------------------

const slug = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getAll = (resource) => getAllFrom(API, resource);

async function fetchIconBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > SANITY_MAX_BYTES) throw new Error('absurdly large');
  return buf;
}

/** Download `items` icons into <resource>/<slug>.png, skipping ones on disk. */
async function downloadIcons(items) {
  const pending = items.filter(
    (it) => it._imageUrl && it._iconPath && !existsSync(join(root, 'src', it._iconPath)),
  );
  console.log(`icons: ${items.length - pending.length} on disk, ${pending.length} to fetch`);

  let done = 0;
  let failed = 0;
  const queue = [...pending];
  async function worker() {
    for (let it = queue.pop(); it; it = queue.pop()) {
      const dest = join(root, 'src', it._iconPath);
      try {
        const buf = await fetchIconBuffer(it._imageUrl);
        await sharp(buf)
          .resize(ICON_MAX_PX, ICON_MAX_PX, { fit: 'inside', withoutEnlargement: true })
          .png({ compressionLevel: 9, palette: true })
          .toFile(dest);
      } catch {
        failed++;
      }
      if (++done % 100 === 0) console.log(`  ${done}/${pending.length}`);
    }
  }
  await Promise.all(
    Array.from({ length: DOWNLOAD_CONCURRENCY }, () => worker()),
  );
  if (failed) console.warn(`  ${failed} icons failed (kept placeholder)`);
}

// --- category classification -------------------------------------------
// The Fan API types the `items` resource only as Consumable / Reusable / Misc,
// far coarser than Elden Ring's inventory tabs — so a few name heuristics do the
// rest. Wrong placements are expected; see scripts/README and docs/adr/0004.

const BOLSTERING_RE =
  /smithing stone|glovewort|beast blood|rune arc|golden rune|numen's rune|hero's rune|lord's rune/i;
const COOKBOOK_RE = /cookbook/i;
const KEY_ITEM_RE =
  /stonesword key|larval tear|memory stone|talisman pouch|golden seed|sacred tear|crystal tear|whetblade|dectus medallion|medallion|great rune|rold medallion|pureblood knight|haligtree secret medal|carian inverted statue|sellia's secret|drawing-room key|imbued sword key|academy glintstone key|rusty key|discarded palace key|dark moon ring|cursemark|amber egg|deathbed|prosthesis|blasphemous claw|dagger of the de|whistle$/i;

// Checked in this order: a name matching more than one pattern takes the first.
const CLASSIFY_RULES = [
  [BOLSTERING_RE, 'bolstering-materials'],
  [COOKBOOK_RE, 'info'],
  [KEY_ITEM_RE, 'key-items'],
];

function classifyItem(name, type) {
  for (const [pattern, category] of CLASSIFY_RULES) {
    if (pattern.test(name)) return category;
  }
  const t = (type || '').toLowerCase();
  if (t === 'misc') return 'crafting-materials';
  if (t === 'reusable') return 'tools';
  return 'consumables';
}

const RANGED_WEAPON_CATS = new Set([
  'Bow',
  'Light Bow',
  'Greatbow',
  'Crossbow',
  'Ballista',
  'Glintstone Staff',
  'Sacred Seal',
]);

const ARMOR_SLOT_RULES = [
  [['helm', 'head'], 'head-armor'],
  [['gauntlet', 'arms'], 'arms-armor'],
  [['leg'], 'legs-armor'],
];

function armorSlotCategory(category) {
  const c = (category || '').toLowerCase();
  for (const [keywords, slot] of ARMOR_SLOT_RULES) {
    if (keywords.some((k) => c.includes(k))) return slot;
  }
  return 'chest-armor';
}

// --- shape normalisers -------------------------------------------------
// A slim, UI-facing shape. Empty / all-zero stat blocks are dropped.

const nonZero = (pairs) => pairs.filter((p) => Number(p.amount) !== 0);
const asRecord = (pairs, key = 'name', val = 'amount') =>
  pairs?.length
    ? Object.fromEntries(pairs.map((p) => [p[key], p[val]]))
    : undefined;

function baseItem(resource, category, e) {
  const s = slug(e.name);
  const icon = `assets/items/${resource}/${s}.png`;
  return {
    id: s,
    name: e.name,
    category,
    icon: undefined, // set in finalise() iff the file exists
    _imageUrl: e.image || null,
    _iconPath: icon,
    description: e.description || undefined,
    source: e.id || undefined,
  };
}

function weaponAssetCategory(resource, apiCategory) {
  if (resource === 'shields') return 'shields';
  return RANGED_WEAPON_CATS.has(apiCategory) ? 'ranged-armaments' : 'melee-armaments';
}

function normWeaponLike(resource, e) {
  return {
    ...baseItem(resource, weaponAssetCategory(resource, e.category), e),
    weaponCategory: e.category || undefined,
    weight: e.weight ?? undefined,
    attack: asRecord(nonZero(e.attack ?? [])),
    guard: asRecord(nonZero(e.defence ?? [])),
    scaling: asRecord(e.scalesWith?.filter((p) => p.scaling && p.scaling !== '-') ?? [], 'name', 'scaling'),
    requires: asRecord(nonZero(e.requiredAttributes ?? [])),
  };
}

function normArmor(e) {
  // The paginated list endpoint uses `dmgNegation` / `resistance` as arrays of
  // { name, amount } (the single-entry endpoint names them differently).
  return {
    ...baseItem('armors', armorSlotCategory(e.category), e),
    weight: e.weight ?? undefined,
    defense: asRecord(nonZero(e.dmgNegation ?? e.damageNegation ?? [])),
    resistance: asRecord(nonZero(e.resistance ?? [])),
  };
}

function normAmmo(e) {
  return {
    ...baseItem('ammos', 'ammo', e),
    ammoType: /bolt/i.test(e.name) ? 'bolt' : 'arrow',
  };
}

function normSpell(resource, e) {
  return {
    ...baseItem(resource, resource, e), // 'sorceries' | 'incantations'
    fpCost: e.cost ?? undefined,
    slots: e.slots ?? undefined,
    effect: e.effects || undefined,
    requires: asRecord(nonZero(e.requires ?? [])),
  };
}

function normSpirit(e) {
  return {
    ...baseItem('spirits', 'spirit-ashes', e),
    fpCost: Number(e.fpCost) || undefined,
    hpCost: Number(e.hpCost) || undefined,
    effect: e.effect || undefined,
  };
}

function normAsh(e) {
  return {
    ...baseItem('ashes', 'ashes-of-war', e),
    affinity: e.affinity || undefined,
    skill: e.skill || undefined,
  };
}

function normTalisman(e) {
  return { ...baseItem('talismans', 'talismans', e), effect: e.effect || undefined };
}

function normGenericItem(e) {
  return {
    ...baseItem('items', classifyItem(e.name, e.type), e),
    effect: e.effect || undefined,
  };
}

// Gestures aren't items (the Fan API has no gesture icons) — a plain name list
// so the tab exists and can be ticked off. Base game.
const GESTURES = [
  'Bow', 'Polite Bow', 'Curtsy', 'Reverential Bow', 'The Ring', 'Nod In Thought',
  'Wave', 'Wave Down', 'Jump for Joy', 'Rejection', 'My Thanks', 'My Favorite Things',
  'Heartening Cheer', 'Dozing Cross-Legged', 'Sitting Sideways', 'Rest', 'Balled Up',
  'Fetal Position', 'Spread Out', 'Point Downwards', 'Point Forwards', 'Beckon',
  'Hurrah!', 'Triumphant Delight', 'Warm Yourself', 'Casual Greeting', 'Calm Down!',
  'As You Wish', 'Grovel for Mercy', 'Crossed Legs', 'Prayer', "Erudition",
  'Strength!', 'Dejection', 'Duelist’s Departure', 'Wrath of God', 'Bravo!',
  'Silence!', 'Finger Snap', 'Extreme Repentance', 'What Do You Want?', 'Regal Salute',
  'Fire in the Sky', 'Golden Order Totality', 'Outer Order', 'Inner Order',
  'Homeward Chant', 'Seppuku', 'The Frenzied Flame', 'Patches’ Crouch',
];

// --- run --------------------------------------------------------------
console.log('fetching Fan API resources...');
const [
  weapons, shields, ammos, armors, talismans,
  sorceries, incantations, spirits, ashes, items,
] = await Promise.all([
  getAll('weapons'), getAll('shields'), getAll('ammos'), getAll('armors'),
  getAll('talismans'), getAll('sorceries'), getAll('incantations'),
  getAll('spirits'), getAll('ashes'), getAll('items'),
]);

const catalogItems = [
  ...weapons.map((e) => normWeaponLike('weapons', e)),
  ...shields.map((e) => normWeaponLike('shields', e)),
  ...ammos.map(normAmmo),
  ...armors.map(normArmor),
  ...talismans.map(normTalisman),
  ...sorceries.map((e) => normSpell('sorceries', e)),
  ...incantations.map((e) => normSpell('incantations', e)),
  ...spirits.map(normSpirit),
  ...ashes.map(normAsh),
  ...items.map(normGenericItem),
  ...GESTURES.map((name) => ({
    id: slug(name), name, category: 'gestures', icon: undefined,
    _imageUrl: null, _iconPath: null,
  })),
];

// De-dupe on id (a handful of items share a name across resources); first wins.
const byId = new Map();
for (const it of catalogItems) if (!byId.has(it.id)) byId.set(it.id, it);
const deduped = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

for (const resource of ['weapons', 'shields', 'ammos', 'armors', 'talismans', 'sorceries', 'incantations', 'spirits', 'ashes', 'items']) {
  mkdirSync(join(ICONS_OUT, resource), { recursive: true });
}
mkdirSync(DATA_OUT, { recursive: true });

/** Strip internal fields; set `icon` only where the file is on disk. */
function finalise(list) {
  return list.map(({ _imageUrl, _iconPath, ...rest }) => {
    const out = { ...rest };
    if (_iconPath && existsSync(join(root, 'src', _iconPath))) out.icon = _iconPath;
    else delete out.icon;
    return out;
  });
}

const CATEGORY_DEFS = [
  { id: 'consumables', name: 'Consumables' },
  { id: 'tools', name: 'Tools' },
  { id: 'crafting-materials', name: 'Materials' },
  { id: 'bolstering-materials', name: 'Bolstering Materials' },
  { id: 'key-items', name: 'Key Items' },
  { id: 'info', name: 'Info' },
  { id: 'sorceries', name: 'Sorceries' },
  { id: 'incantations', name: 'Incantations' },
  { id: 'ashes-of-war', name: 'Ashes of War' },
  { id: 'melee-armaments', name: 'Melee Armaments' },
  { id: 'ranged-armaments', name: 'Ranged Armaments' },
  { id: 'ammo', name: 'Arrows & Bolts' },
  { id: 'shields', name: 'Shields' },
  { id: 'head-armor', name: 'Head Armor' },
  { id: 'chest-armor', name: 'Chest Armor' },
  { id: 'arms-armor', name: 'Arms Armor' },
  { id: 'legs-armor', name: 'Leg Armor' },
  { id: 'talismans', name: 'Talismans' },
  { id: 'spirit-ashes', name: 'Spirit Ashes' },
  { id: 'gestures', name: 'Gestures' },
];

function buildCatalog(list) {
  const body = {
    attribution:
      'Item data and icons from the Elden Ring Fan API (eldenring.fanapis.com). ' +
      'Game data and imagery © FromSoftware / Bandai Namco. Base game only.',
    categories: CATEGORY_DEFS,
    items: finalise(list),
  };
  return {
    version:
      'i' +
      createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 11),
    ...body,
  };
}

// 1) write the catalog now (icons may still be missing — that's fine)
writeIfChanged(
  join(DATA_OUT, 'item-catalog.json'),
  JSON.stringify(buildCatalog(deduped), null, 0) + '\n',
);

// 2) download whatever icons are missing
await downloadIcons(deduped.filter((it) => it._iconPath));

// 3) re-write with the icons that now exist
const withIcons = buildCatalog(deduped);
writeIfChanged(
  join(DATA_OUT, 'item-catalog.json'),
  JSON.stringify(withIcons, null, 0) + '\n',
);

const counts = withIcons.items.reduce((a, it) => {
  a[it.category] = (a[it.category] ?? 0) + 1;
  return a;
}, {});
const withIcon = withIcons.items.filter((it) => it.icon).length;
console.log(`\nitem-catalog.json: ${withIcons.items.length} items, ${withIcon} with icons`);
console.log(counts);
