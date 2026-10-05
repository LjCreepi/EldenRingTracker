/**
 * Wondrous Physick — mixing two Crystal Tears into the Flask of Wondrous
 * Physick for a temporary buff. See CONTEXT.md → "Wondrous Physick".
 */
import { AttributeId, ATTRIBUTE_NAMES } from './character-sheet.model';
import { Item } from './item.model';

/**
 * Every base-game Crystal Tear's Item Catalog id. The catalog itself has no
 * dedicated category for them (they land in `key-items` or `consumables`
 * depending on the Fan API's classification), so this hand-curated list is
 * how the Physick Mix picker and the effect table both know which Items are
 * Crystal Tears. Base game only — see CONTEXT.md → "Scope".
 */
export const CRYSTAL_TEAR_ITEM_IDS: readonly string[] = [
  'crimson-crystal-tear',
  'cerulean-crystal-tear',
  'crimsonburst-crystal-tear',
  'crimsonspill-crystal-tear',
  'greenburst-crystal-tear',
  'greenspill-crystal-tear',
  'strength-knot-crystal-tear',
  'dexterity-knot-crystal-tear',
  'intelligence-knot-crystal-tear',
  'faith-knot-crystal-tear',
  'purifying-crystal-tear',
  'ruptured-crystal-tear',
  'windy-crystal-tear',
  'winged-crystal-tear',
  'cerulean-hidden-tear',
  'crimson-bubbletear',
  'crimsonwhorl-bubbletear',
  'flame-shrouding-cracked-tear',
  'holy-shrouding-cracked-tear',
  'leaden-hardtear',
  'lightning-shrouding-cracked-tear',
  'magic-shrouding-cracked-tear',
  'opaline-bubbletear',
  'opaline-hardtear',
  'speckled-hardtear',
  'spiked-cracked-tear',
  'stonebarb-cracked-tear',
  'thorny-cracked-tear',
  'twiggy-cracked-tear',
];

/**
 * A hand-curated, verified numeric effect for a Crystal Tear — only for the
 * ones whose magnitude is well-documented (community-verified against
 * Fextralife/Game8; see docs/adr/0009). Tears not listed here still show
 * their catalog `effect`/`description` text; they just have no numeric delta
 * modeled yet.
 */
export interface CrystalTearEffect {
  readonly attribute: AttributeId;
  readonly amount: number;
  readonly durationSeconds: number;
}

export const CRYSTAL_TEAR_ATTRIBUTE_EFFECTS: Readonly<
  Record<string, CrystalTearEffect>
> = {
  'strength-knot-crystal-tear': { attribute: 'strength', amount: 10, durationSeconds: 180 },
  'dexterity-knot-crystal-tear': { attribute: 'dexterity', amount: 10, durationSeconds: 180 },
  'intelligence-knot-crystal-tear': { attribute: 'intelligence', amount: 10, durationSeconds: 180 },
  'faith-knot-crystal-tear': { attribute: 'faith', amount: 10, durationSeconds: 180 },
};

/** Instant on-drink restores that aren't ongoing attribute buffs. */
export const CRYSTAL_TEAR_INSTANT_RESTORE: Readonly<Record<string, { hpPct?: number; fpPct?: number }>> = {
  'crimson-crystal-tear': { hpPct: 50 },
  'cerulean-crystal-tear': { fpPct: 50 },
};

/**
 * A short, human-readable effect line for a Crystal Tear — the modeled
 * numeric effect where one is curated above, otherwise the catalog's own
 * `effect`/`description` text. Used both in the Physick Mix picker (so the
 * effect is visible while choosing) and next to the equipped tear.
 */
export function crystalTearEffectSummary(item: Item): string | null {
  const attrFx = CRYSTAL_TEAR_ATTRIBUTE_EFFECTS[item.id];
  if (attrFx) {
    return `+${attrFx.amount} ${ATTRIBUTE_NAMES[attrFx.attribute]} for ${attrFx.durationSeconds}s`;
  }
  const restore = CRYSTAL_TEAR_INSTANT_RESTORE[item.id];
  if (restore?.hpPct) return `Restores ${restore.hpPct}% max HP`;
  if (restore?.fpPct) return `Restores ${restore.fpPct}% max FP`;
  return item.effect ?? item.description ?? null;
}
