/**
 * The build choices behind one equipped armament/shield's Attack Rating:
 * upgrade level, upgrade path, Affinity and two-handing. See CONTEXT.md →
 * "Attack Rating" and docs/adr/0010.
 */

export type UpgradePath = 'standard' | 'somber';

export const AFFINITY_IDS = [
  'standard',
  'heavy',
  'keen',
  'quality',
  'fire',
  'flame-art',
  'lightning',
  'sacred',
  'magic',
  'cold',
  'poison',
  'blood',
  'occult',
] as const;
export type AffinityId = (typeof AFFINITY_IDS)[number];

export const AFFINITY_NAMES: Readonly<Record<AffinityId, string>> = {
  standard: 'Standard',
  heavy: 'Heavy',
  keen: 'Keen',
  quality: 'Quality',
  fire: 'Fire',
  'flame-art': 'Flame Art',
  lightning: 'Lightning',
  sacred: 'Sacred',
  magic: 'Magic',
  cold: 'Cold',
  poison: 'Poison',
  blood: 'Blood',
  occult: 'Occult',
};

export interface ArmamentBuild {
  readonly upgradeLevel: number;
  readonly upgradePath: UpgradePath;
  readonly affinity: AffinityId;
  readonly twoHanded: boolean;
}

export function maxUpgradeLevel(path: UpgradePath): number {
  return path === 'somber' ? 10 : 25;
}

/**
 * Best-effort, non-exhaustive list of base-game "special" weapons that use
 * Somber Smithing Stones (max +10) rather than ordinary ones (max +25) — the
 * Item Catalog has no such field (the Fan API doesn't expose the game's own
 * `reinforceTypeId`), and a complete, verified list of the ~137 special
 * weapons/shields wasn't obtainable in the time available. This only seeds
 * the Upgrade Path picker's *default* — it's always user-editable, so a wrong
 * guess here just means a one-tap correction, not a wrong Attack Rating that
 * can't be fixed. See docs/adr/0010.
 */
export const SOMBER_WEAPON_IDS: ReadonlySet<string> = new Set([
  'moonveil',
  'hand-of-malenia',
  'rivers-of-blood',
  'starscourge-greatsword',
  'sword-of-night-and-flame',
  'dark-moon-greatsword',
  'golden-order-greatsword',
  'marika-s-hammer',
  'blasphemous-blade',
  'ordovis-s-greatsword',
  'black-knife',
  'wing-of-astel',
  'bolt-of-gransax',
  'carian-regal-scepter',
  'lusat-s-glintstone-staff',
  'azur-s-glintstone-staff',
  'staff-of-loss',
  'frenzied-flame-seal',
  'godslayer-s-seal',
  'exalted-flesh',
  'ghiza-s-wheel',
  'star-fist',
  'golem-greatbow',
  'lion-greatbow',
  'vyke-s-war-spear',
  'godskin-peeler',
  'eleonora-s-poleblade',
  'zamor-curved-sword',
  'fallingstar-beast-jaw',
  'troll-s-golden-sword',
  'veteran-s-prosthesis',
  'golden-halberd',
  'loretta-s-war-sickle',
  'rotten-crystal-sword',
  'regalia-of-eochaid',
  'grafted-blade-greatsword',
  'bloodhound-s-fang',
]);

export function defaultArmamentBuild(itemId: string): ArmamentBuild {
  return {
    upgradeLevel: 0,
    upgradePath: SOMBER_WEAPON_IDS.has(itemId) ? 'somber' : 'standard',
    affinity: 'standard',
    twoHanded: false,
  };
}
