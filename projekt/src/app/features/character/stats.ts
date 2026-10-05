/**
 * Derived character stats. Pure — no Angular, no DOM — so it can be unit-tested
 * like `features/map/marker-visibility.ts`.
 *
 * Fidelity (see docs/adr/0005):
 *   - Equip Load %, roll weight and Level are EXACT.
 *   - HP / FP / Stamina / max Equip Load are interpolated between the
 *     community-documented attribute breakpoints — close, not canonical.
 *   - Poise / Discovery / defences sum the equipped armour with a light formula.
 *   - Attack Rating is NOT simulated.
 * Anything not exact is flagged `approximate: true` for the UI.
 */
import {
  ATTRIBUTE_IDS,
  AttributeId,
  Attributes,
  StartingClass,
} from '../../core/models/character-sheet.model';
import { Item } from '../../core/models/item.model';
import {
  ArmamentBuild,
  maxUpgradeLevel,
} from '../../core/models/weapon-build.model';

/** Piecewise-linear read of a `[stat, value]` breakpoint table. */
function interp(
  table: readonly (readonly [number, number])[],
  x: number,
  round = true,
): number {
  const clamped = Math.max(table[0][0], Math.min(table[table.length - 1][0], x));
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    if (clamped <= x1) {
      const [x0, y0] = table[i - 1];
      const t = x1 === x0 ? 0 : (clamped - x0) / (x1 - x0);
      const v = y0 + t * (y1 - y0);
      return round ? Math.round(v) : v;
    }
  }
  return table[table.length - 1][1];
}

// Anchor points from community stat tables. Soft caps sit at the kinks.
const HP_BY_VIGOR = [
  [1, 300], [10, 414], [20, 633], [25, 812], [30, 968], [35, 1150],
  [40, 1450], [45, 1500], [50, 1553], [55, 1626], [60, 1900], [70, 1936],
  [80, 1967], [90, 1994], [99, 2100],
] as const;

const FP_BY_MIND = [
  [1, 50], [10, 82], [15, 100], [25, 155], [35, 250], [45, 280],
  [50, 300], [55, 315], [60, 350], [70, 375], [99, 450],
] as const;

const STAMINA_BY_END = [
  [1, 80], [10, 92], [15, 100], [30, 130], [40, 145], [50, 155], [99, 170],
] as const;

const EQUIP_LOAD_BY_END = [
  [1, 45], [10, 48], [15, 55], [25, 72], [30, 79], [40, 92], [50, 105],
  [60, 120], [70, 132], [80, 143], [90, 152], [99, 160],
] as const;

export function maxHp(vigor: number): number {
  return interp(HP_BY_VIGOR, vigor);
}
function maxFp(mind: number): number {
  return interp(FP_BY_MIND, mind);
}
function maxStamina(endurance: number): number {
  return interp(STAMINA_BY_END, endurance);
}
export function maxEquipLoad(endurance: number): number {
  return interp(EQUIP_LOAD_BY_END, endurance);
}

/** Exact: character Level from class base + points invested. */
export function derivedLevel(attributes: Attributes, cls: StartingClass): number {
  const invested = ATTRIBUTE_IDS.reduce(
    (sum, id) => sum + (attributes[id] - cls.attributes[id]),
    0,
  );
  return cls.level + invested;
}

/**
 * Approximate runes to reach the next level — the community-fitted cubic for the
 * standard cost curve (accurate to a few % from ~level 12 up; a touch high
 * below that). Not the canonical per-level table.
 */
function runesForNextLevel(level: number): number {
  const next = level + 1;
  if (next <= 1) return 0;
  return Math.max(
    0,
    Math.round(0.02 * next ** 3 + 3.06 * next ** 2 + 105.6 * next - 895),
  );
}

export type LoadState = 'light' | 'medium' | 'heavy' | 'overloaded';

/** Exact: roll weight band from equipped weight vs. max load. */
export function loadState(current: number, max: number): LoadState {
  if (max <= 0) return 'overloaded';
  const ratio = current / max;
  if (ratio >= 1) return 'overloaded';
  if (ratio > 0.7) return 'heavy';
  if (ratio >= 0.3) return 'medium';
  return 'light';
}

export const LOAD_STATE_LABEL: Readonly<Record<LoadState, string>> = {
  light: 'Light Load',
  medium: 'Med. Load',
  heavy: 'Heavy Load',
  overloaded: 'Overloaded',
};

/** Sum a named stat across the equipped armour pieces. */
function sumArmor(
  armor: readonly Item[],
  pick: (i: Item) => Readonly<Record<string, number>> | undefined,
  key: string,
): number {
  return armor.reduce((sum, i) => sum + (pick(i)?.[key] ?? 0), 0);
}

export interface DerivedStats {
  level: number;
  runesForNext: number;
  hp: number;
  fp: number;
  stamina: number;
  equipLoad: { current: number; max: number; state: LoadState };
  poise: number;
  discovery: number;
  /** Physical / Magic / Fire / Lightning / Holy damage negation. */
  defense: Record<string, number>;
  /** Immunity / Robustness / Focus / Vitality. */
  resistance: Record<string, number>;
  /** Everything except equipLoad, level and discovery is an estimate. */
  approximate: true;
}

/**
 * Golden Seeds / Sacred Tears cost to unlock each successive Flask level,
 * community-documented (base game). Cumulative sum of a level's cost tells you
 * how many *used* Seeds/Tears it takes to reach that level.
 */
const GOLDEN_SEED_LEVEL_COST = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6] as const;
const SACRED_TEAR_LEVEL_COST = [1, 1, 2, 2, 4] as const;
const BASE_FLASK_CHARGES = 3;

/** How many of the level-cost table's levels `used` fully pays for. */
function flaskLevel(used: number, costs: readonly number[]): number {
  let remaining = used;
  let level = 0;
  for (const cost of costs) {
    if (remaining < cost) break;
    remaining -= cost;
    level++;
  }
  return level;
}

/** Total Flask charges (Crimson + Cerulean) from Golden Seeds used so far. */
export function flaskCharges(goldenSeedsUsed: number): number {
  return BASE_FLASK_CHARGES + flaskLevel(goldenSeedsUsed, GOLDEN_SEED_LEVEL_COST);
}

/** Flask Potency tier (0–5) from Sacred Tears used so far. */
export function flaskPotencyTier(sacredTearsUsed: number): number {
  return flaskLevel(sacredTearsUsed, SACRED_TEAR_LEVEL_COST);
}

export const FLASK_POTENCY_MAX_TIER = SACRED_TEAR_LEVEL_COST.length;

export interface EquippedContext {
  /** Every equipped item (armaments, armour, talismans, …). */
  equipped: readonly Item[];
}

export function derivedStats(
  attributes: Attributes,
  cls: StartingClass,
  ctx: EquippedContext,
): DerivedStats {
  const armor = ctx.equipped.filter((i) => i.category.endsWith('-armor'));
  const currentWeight = ctx.equipped.reduce((w, i) => w + (i.weight ?? 0), 0);
  const max = maxEquipLoad(attributes.endurance);
  const level = derivedLevel(attributes, cls);

  const defenseKeys = ['Phy', 'Magic', 'Fire', 'Ligt', 'Holy'];
  const defense: Record<string, number> = {};
  for (const k of defenseKeys) {
    defense[k] =
      sumArmor(armor, (i) => i.defense, k) + Math.round(level * 0.35);
  }

  const resistanceKeys = ['Immunity', 'Robustness', 'Focus', 'Vitality'];
  const resistance: Record<string, number> = {};
  const arcaneBonus = Math.round(attributes.arcane * 0.7);
  for (const k of resistanceKeys) {
    resistance[k] =
      sumArmor(armor, (i) => i.resistance, k) + 40 + arcaneBonus;
  }

  return {
    level,
    runesForNext: runesForNextLevel(level),
    hp: maxHp(attributes.vigor),
    fp: maxFp(attributes.mind),
    stamina: maxStamina(attributes.endurance),
    equipLoad: {
      current: Math.round(currentWeight * 10) / 10,
      max,
      state: loadState(currentWeight, max),
    },
    poise: sumArmor(armor, (i) => i.resistance, 'Poise'),
    discovery: 100 + attributes.arcane,
    defense,
    resistance,
    approximate: true,
  };
}

// --- Attack Rating (see docs/adr/0010) ------------------------------------
//
// Fidelity split, unlike the rest of this file:
//  - Upgrade-level multipliers below are VERIFIED against real per-weapon
//    attack-per-level tables (Longsword for Standard, Moonveil for Somber).
//  - The attribute soft-cap curve and grade coefficients are a best-effort
//    approximation of the real per-weapon `calcCorrectGraph` system, which
//    needs data this app's Item Catalog doesn't have. The breakpoint
//    *locations* (~20/50/80) are well-established; the exact percentages at
//    each point are not verified the way the upgrade curves are.
//  - Affinity is stored and shown but does not yet change the computed
//    number — only Standard-affinity math is modeled (see the ADR).
// Attack Rating is therefore not flagged `approximate` like the rest of
// DerivedStats (it's meant to be read as a real number, not a range), but
// carries its own, separate disclosure in the UI.

/** +0..+25 physical attack multiplier, from the Longsword's real per-level values. */
const STANDARD_UPGRADE_MULTIPLIER = [
  1.0, 1.055, 1.109, 1.173, 1.227, 1.282, 1.345, 1.4, 1.464, 1.518, 1.573,
  1.636, 1.691, 1.745, 1.809, 1.864, 1.927, 1.982, 2.036, 2.1, 2.155, 2.209,
  2.273, 2.327, 2.391, 2.445,
] as const;

/** +0..+10 physical attack multiplier, from the Moonveil's real per-level values. */
const SOMBER_UPGRADE_MULTIPLIER = [
  1.0, 1.137, 1.288, 1.425, 1.575, 1.712, 1.863, 2.014, 2.151, 2.301, 2.438,
] as const;

function upgradeMultiplier(level: number, path: ArmamentBuild['upgradePath']): number {
  const table = path === 'somber' ? SOMBER_UPGRADE_MULTIPLIER : STANDARD_UPGRADE_MULTIPLIER;
  const clamped = Math.max(0, Math.min(table.length - 1, Math.round(level)));
  return table[clamped];
}

/**
 * Best-effort approximation of the real soft-cap curve: fraction (0–1) of a
 * scaling grade's maximum bonus unlocked at a given attribute value. Anchor
 * points sit at the community-known soft-cap locations (~20/50/80).
 */
const SCALING_SOFT_CAP = [
  [1, 0], [20, 0.4], [50, 0.75], [80, 0.93], [99, 1],
] as const;

function softCapFraction(statValue: number): number {
  return interp(SCALING_SOFT_CAP, statValue, false);
}

/** Best-effort fraction of total AR a maxed-out grade contributes at 99 in that attribute. */
const GRADE_MAX_SCALING: Readonly<Record<string, number>> = {
  S: 1.5,
  A: 1.1,
  B: 0.8,
  C: 0.55,
  D: 0.35,
  E: 0.15,
};

const SCALING_KEY_TO_ATTRIBUTE: Readonly<Record<string, AttributeId>> = {
  str: 'strength',
  dex: 'dexterity',
  int: 'intelligence',
  intelligence: 'intelligence',
  fai: 'faith',
  faith: 'faith',
  arc: 'arcane',
  arcane: 'arcane',
};

/** The catalog's `attack` keys that are real weapon damage (not Crit/Rng/spell-tool stats). */
const DAMAGE_TYPE_KEYS = ['Phy', 'Mag', 'Fire', 'Ligt', 'Holy'] as const;

export interface AttackRatingResult {
  /** Per damage type, e.g. `{ Phy: 412 }`. */
  readonly byType: Readonly<Record<string, number>>;
  readonly total: number;
}

/**
 * An armament's Attack Rating from its catalog base stats, the Character's
 * (Physick-adjusted) attributes, and its build (upgrade level/path,
 * two-handing). `null` if the Item has no weapon `attack` block (e.g. it's
 * not equippable as an armament). Affinity is not yet applied — see the
 * fidelity note above.
 */
export function weaponAttackRating(
  item: Item,
  attributes: Attributes,
  build: ArmamentBuild,
): AttackRatingResult | null {
  if (!item.attack || !Object.keys(item.attack).length) return null;

  const effectiveStrength = build.twoHanded
    ? Math.floor(attributes.strength * 1.5)
    : attributes.strength;
  const effectiveAttributes: Attributes = { ...attributes, strength: effectiveStrength };

  const level = Math.max(0, Math.min(maxUpgradeLevel(build.upgradePath), build.upgradeLevel));
  const mult = upgradeMultiplier(level, build.upgradePath);

  const byType: Record<string, number> = {};
  let total = 0;
  for (const key of DAMAGE_TYPE_KEYS) {
    const base = item.attack[key];
    if (!base) continue;

    let totalScaling = 1;
    for (const [scalingKey, grade] of Object.entries(item.scaling ?? {})) {
      const attributeId = SCALING_KEY_TO_ATTRIBUTE[scalingKey.trim().toLowerCase()];
      const coefficient = GRADE_MAX_SCALING[grade.trim().toUpperCase()];
      if (!attributeId || !coefficient) continue;
      totalScaling += softCapFraction(effectiveAttributes[attributeId]) * coefficient;
    }

    const value = Math.round(base * mult * totalScaling);
    byType[key] = value;
    total += value;
  }

  return { byType, total };
}
