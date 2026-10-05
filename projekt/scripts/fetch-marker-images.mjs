/**
 * Downloads marker imagery from the Elden Ring Fan API
 * (https://eldenring.fanapis.com) into committed assets:
 *
 *   src/assets/markers/<category>.png        authentic item icon per collectible
 *   src/assets/marker-images/boss/<slug>.jpg screenshot per boss name
 *   tempAssets/fan-api/boss-images.json      boss name -> asset path (read by
 *                                            prepare-map-assets.mjs)
 *
 * Every image is downscaled with `sharp` before it lands in the repo (icons to
 * 128 px, boss shots to 500 px / JPEG q78).
 *
 * Unlike `prepare:map` this hits the network, so it is a **manual** step — its
 * output is committed and a normal build never runs it. Re-run when you want to
 * refresh the imagery.
 *
 *   npm run fetch:images
 *
 * The images are FromSoftware assets served by a community API; same
 * non-commercial fan-use position as the map tiles (see docs/adr/0002).
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getAll as getAllFrom } from './lib/fan-api.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARKERS_DIR = join(root, 'src', 'assets', 'markers');
const BOSS_IMG_DIR = join(root, 'src', 'assets', 'marker-images', 'boss');
const FAN_API_DIR = join(root, 'tempAssets', 'fan-api');
const CATALOG = join(root, 'src', 'assets', 'data', 'marker-catalog.json');

const API = 'https://eldenring.fanapis.com/api';

// Everything the Fan API serves is downscaled locally with sharp before it lands
// in the repo — some boss images are multi-MB wallpapers, wasted on a popover.
const BOSS_MAX_PX = 500; // longest edge of a boss screenshot
const ICON_MAX_PX = 128; // longest edge of a collectible icon
const SANITY_MAX_BYTES = 25 * 1024 * 1024; // refuse to buffer something absurd

/** Representative item name for each collectible category's pin icon. */
const CATEGORY_ICON_ITEM = {
  'golden-seeds': 'Golden Seed',
  'sacred-tears': 'Sacred Tear',
  'larval-tears': 'Larval Tear',
  'memory-stones': 'Memory Stone',
  'talisman-pouches': 'Talisman Pouch',
  'crystal-tears': 'Crimson Crystal Tear',
  whetblades: 'Glintstone Whetblade',
  cookbooks: "Armorer's Cookbook [1]",
  gloveworts: 'Grave Glovewort [1]',
  // 'bell-bearings' — the Fan API has no bell-bearing items; stays on placeholder.
};

const deburr = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const slug = (name) =>
  deburr(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** lowercase, drop "(weapon)" suffixes, punctuation and a leading "the " */
const normaliseName = (name) =>
  deburr(name)
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '');

/** normalised, with all spaces removed and a trailing plural 's' dropped */
const loose = (name) => normaliseName(name).replace(/ /g, '').replace(/s$/, '');

const prefixHit = (norm, exact) =>
  [...exact.entries()].find(([k]) => k.startsWith(norm) || norm.startsWith(k))?.[1];

// Additive fallback (see scripts/README "Boss art coverage"): match when every
// significant word of the shorter name also appears in the other — catches
// "Full-Grown Fallingstar Beast" vs "Fallingstar Beast" and epithet forms like
// "Margit, the Fell Omen". Guarded: needs >=2 shared long words so a lone
// "beast" / "knight" / "dragon" never collides. Purely additive — it only runs
// when the checks above found nothing, so it can raise the match count but not
// lower it.
function tokenOverlapHit(norm, exact) {
  const wantTokens = norm.split(' ').filter((t) => t.length > 2);
  for (const [k, boss] of exact) {
    const haveTokens = k.split(' ').filter((t) => t.length > 2);
    const [shorter, longerSet] =
      wantTokens.length <= haveTokens.length
        ? [wantTokens, new Set(haveTokens)]
        : [haveTokens, new Set(wantTokens)];
    if (shorter.length >= 2 && shorter.every((t) => longerSet.has(t))) {
      return boss;
    }
  }
  return undefined;
}

/** Fan API boss whose name is our best match, or null. Tries, in order:
 *  exact normalised name, loose (space/plural-insensitive) name, a prefix
 *  match either way, then the token-overlap fallback above. */
function matchBoss(name, exact, byLoose) {
  const norm = normaliseName(name);
  return (
    exact.get(norm) ||
    byLoose.get(loose(name)) ||
    prefixHit(norm, exact) ||
    tokenOverlapHit(norm, exact) ||
    null
  );
}

const getAll = (resource) => getAllFrom(API, resource);

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > SANITY_MAX_BYTES) throw new Error(`absurdly large: ${url}`);
  return buf;
}

/** Fetch an image and write it downscaled to `dest`. */
async function fetchImage(url, dest, { maxPx, format }) {
  let img = sharp(await fetchBuffer(url))
    .rotate()
    .resize(maxPx, maxPx, { fit: 'inside', withoutEnlargement: true });
  img =
    format === 'png'
      ? img.png({ compressionLevel: 9, palette: true })
      : img.jpeg({ quality: 78, mozjpeg: true });
  writeFileSync(dest, await img.toBuffer());
}

// --- collectible category icons -----------------------------------------
mkdirSync(MARKERS_DIR, { recursive: true });
const items = await getAll('items');
const itemByName = new Map(items.map((i) => [normaliseName(i.name), i]));

for (const [categoryId, itemName] of Object.entries(CATEGORY_ICON_ITEM)) {
  const item = itemByName.get(normaliseName(itemName));
  if (!item?.image) {
    console.warn(`! no image for "${itemName}" (${categoryId}) — keeping placeholder`);
    continue;
  }
  const dest = join(MARKERS_DIR, `${categoryId}.png`);
  await fetchImage(item.image, dest, { maxPx: ICON_MAX_PX, format: 'png' });
  console.log(`icon  ${categoryId} <- ${item.name}`);
}

// --- boss screenshots --------------------------------------------------
// Clear stale files without removing the dir (Windows locks directories).
mkdirSync(BOSS_IMG_DIR, { recursive: true });
mkdirSync(FAN_API_DIR, { recursive: true });
for (const f of readdirSync(BOSS_IMG_DIR)) {
  try {
    rmSync(join(BOSS_IMG_DIR, f), { force: true });
  } catch {
    /* leave a locked file; it'll be overwritten if still matched */
  }
}
const bosses = (await getAll('bosses')).filter((b) => b.image);
const bossExact = new Map(bosses.map((b) => [normaliseName(b.name), b]));
const bossLoose = new Map(bosses.map((b) => [loose(b.name), b]));

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const bossNames = [
  ...new Set(
    catalog.markers
      .filter((m) => m.categoryId === 'bosses')
      .map((m) => m.name),
  ),
];

const bossImages = {};
const downloaded = new Map(); // image url -> asset path (dedupe shared art)
for (const name of bossNames) {
  const hit = matchBoss(name, bossExact, bossLoose);
  if (!hit) continue;
  if (downloaded.has(hit.image)) {
    bossImages[name] = downloaded.get(hit.image);
    continue;
  }
  const file = `${slug(name)}.jpg`;
  try {
    await fetchImage(hit.image, join(BOSS_IMG_DIR, file), {
      maxPx: BOSS_MAX_PX,
      format: 'jpeg',
    });
  } catch (err) {
    console.warn(`! ${name}: ${err.message}`);
    continue;
  }
  const path = `assets/marker-images/boss/${file}`;
  downloaded.set(hit.image, path);
  bossImages[name] = path;
}
const matched = Object.keys(bossImages).length;
writeFileSync(
  join(FAN_API_DIR, 'boss-images.json'),
  JSON.stringify(bossImages, null, 2) + '\n',
);
console.log(`boss images: ${matched}/${bossNames.length} names matched`);

// Refresh the delimited coverage block in scripts/README.md (that file explains
// it). Only the text between the two markers is touched — never the whole file.
updateCoverageBlock(matched, bossNames);

console.log('done — run `npm run prepare:map` to fold boss images into the catalog');

/** Rewrite the `<!-- boss-image-coverage -->` block in scripts/README.md. */
function updateCoverageBlock(matchedCount, allNames) {
  const readmePath = join(root, 'scripts', 'README.md');
  const unmatched = allNames.filter((n) => !bossImages[n]).sort();
  const today = new Date().toISOString().slice(0, 10);
  const block =
    `<!-- boss-image-coverage:start -->\n` +
    `**Boss art coverage:** ${matchedCount} / ${allNames.length} boss names ` +
    `matched (regenerated ${today} by \`npm run fetch:images\`).\n\n` +
    (unmatched.length
      ? `Unmatched (fall back to the no-image popover):\n` +
        unmatched.map((n) => `- ${n}`).join('\n') +
        `\n`
      : `Every boss name matched an image.\n`) +
    `<!-- boss-image-coverage:end -->`;

  const readme = readFileSync(readmePath, 'utf8');
  const next = readme.replace(
    /<!-- boss-image-coverage:start -->[\s\S]*?<!-- boss-image-coverage:end -->/,
    () => block,
  );
  if (next === readme) {
    console.warn('! scripts/README.md: coverage markers not found — left as-is');
  } else {
    writeFileSync(readmePath, next);
    console.log(`scripts/README.md: coverage block updated (${unmatched.length} unmatched)`);
  }
}
