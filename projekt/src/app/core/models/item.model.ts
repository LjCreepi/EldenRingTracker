/**
 * The read-only Item Catalog and everything in it. Built from the Elden Ring Fan
 * API by `scripts/fetch-item-catalog.mjs`, shipped as a static asset.
 * See CONTEXT.md → "Item" and docs/adr/0004.
 */

/** An inventory tab, mirroring Elden Ring's own categories. */
export type ItemCategoryId =
  | 'consumables'
  | 'tools'
  | 'crafting-materials'
  | 'bolstering-materials'
  | 'key-items'
  | 'info'
  | 'sorceries'
  | 'incantations'
  | 'ashes-of-war'
  | 'melee-armaments'
  | 'ranged-armaments'
  | 'ammo'
  | 'shields'
  | 'head-armor'
  | 'chest-armor'
  | 'arms-armor'
  | 'legs-armor'
  | 'talismans'
  | 'spirit-ashes'
  | 'gestures';

/** A named stat block, e.g. `{ Phy: 113, Crit: 100 }`. */
export type StatBlock = Readonly<Record<string, number>>;

/**
 * One kind of obtainable thing. `x`/`y` have no meaning here — an Item is a
 * thing, not a place. Optional stat fields are only present where the Fan API
 * had them (weapons carry `attack`/`scaling`, armour carries `defense`, …).
 */
export interface Item {
  readonly id: string;
  readonly name: string;
  readonly category: ItemCategoryId;
  /** Asset path of the 64 px icon, or absent → the UI shows a placeholder. */
  readonly icon?: string;
  readonly description?: string;
  readonly effect?: string;
  readonly weight?: number;
  /** Fan API weapon/shield class ("Greatsword", "Glintstone Staff", …). */
  readonly weaponCategory?: string;
  /** Which nock slot an ammo item takes. */
  readonly ammoType?: 'arrow' | 'bolt';
  /** FP / HP cost for spells and spirit ashes. */
  readonly fpCost?: number;
  readonly hpCost?: number;
  /** Memory slots a spell occupies. */
  readonly slots?: number;
  /** Ash of War affinity / granted skill. */
  readonly affinity?: string;
  readonly skill?: string;
  readonly attack?: StatBlock;
  readonly guard?: StatBlock;
  readonly defense?: StatBlock;
  readonly resistance?: StatBlock;
  /** Attribute scaling grades, e.g. `{ Str: 'D', Dex: 'E' }`. */
  readonly scaling?: Readonly<Record<string, string>>;
  /** Attribute requirements, e.g. `{ Str: 14, Dex: 8 }`. */
  readonly requires?: StatBlock;
  /** Fan API id — kept only so the fetch script can match on re-run. */
  readonly source?: string;
}

export interface ItemCategoryDef {
  readonly id: ItemCategoryId;
  readonly name: string;
}

export interface ItemCatalog {
  /** Content hash, prefix `i…`. Not the app's SemVer. */
  readonly version: string;
  readonly attribution: string;
  readonly categories: readonly ItemCategoryDef[];
  readonly items: readonly Item[];
}

/** Tab order for the Inventory screen — Elden Ring's own grouping. */
export const ITEM_CATEGORY_ORDER: readonly ItemCategoryId[] = [
  'consumables',
  'tools',
  'crafting-materials',
  'bolstering-materials',
  'key-items',
  'info',
  'sorceries',
  'incantations',
  'ashes-of-war',
  'melee-armaments',
  'ranged-armaments',
  'ammo',
  'shields',
  'head-armor',
  'chest-armor',
  'arms-armor',
  'legs-armor',
  'talismans',
  'spirit-ashes',
  'gestures',
];

export const ITEM_ICON_PLACEHOLDER = 'assets/items/placeholder.svg';
