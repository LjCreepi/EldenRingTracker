/**
 * The equipment slots a Character's Loadout fills. One item id per slot;
 * memorised spells are a list, not fixed slots. See CONTEXT.md → "Loadout".
 */
import { ItemCategoryId } from './item.model';
import { ArmamentBuild } from './weapon-build.model';

export type EquipSlotId =
  | 'right-hand-1'
  | 'right-hand-2'
  | 'right-hand-3'
  | 'left-hand-1'
  | 'left-hand-2'
  | 'left-hand-3'
  | 'head'
  | 'chest'
  | 'arms'
  | 'legs'
  | 'talisman-1'
  | 'talisman-2'
  | 'talisman-3'
  | 'talisman-4'
  | 'arrow-1'
  | 'arrow-2'
  | 'bolt-1'
  | 'bolt-2'
  | 'spirit-ash'
  | 'great-rune';

export interface EquipSlotDef {
  readonly id: EquipSlotId;
  readonly name: string;
  /** Visual grouping on the Equipment screen. */
  readonly group: 'armaments' | 'ranged' | 'armor' | 'talismans' | 'other';
}

export const EQUIP_SLOTS: readonly EquipSlotDef[] = [
  { id: 'right-hand-1', name: 'Right Hand 1', group: 'armaments' },
  { id: 'right-hand-2', name: 'Right Hand 2', group: 'armaments' },
  { id: 'right-hand-3', name: 'Right Hand 3', group: 'armaments' },
  { id: 'left-hand-1', name: 'Left Hand 1', group: 'armaments' },
  { id: 'left-hand-2', name: 'Left Hand 2', group: 'armaments' },
  { id: 'left-hand-3', name: 'Left Hand 3', group: 'armaments' },
  { id: 'arrow-1', name: 'Arrows', group: 'ranged' },
  { id: 'arrow-2', name: 'Arrows', group: 'ranged' },
  { id: 'bolt-1', name: 'Bolts', group: 'ranged' },
  { id: 'bolt-2', name: 'Bolts', group: 'ranged' },
  { id: 'head', name: 'Head', group: 'armor' },
  { id: 'chest', name: 'Chest', group: 'armor' },
  { id: 'arms', name: 'Arms', group: 'armor' },
  { id: 'legs', name: 'Legs', group: 'armor' },
  { id: 'talisman-1', name: 'Talisman 1', group: 'talismans' },
  { id: 'talisman-2', name: 'Talisman 2', group: 'talismans' },
  { id: 'talisman-3', name: 'Talisman 3', group: 'talismans' },
  { id: 'talisman-4', name: 'Talisman 4', group: 'talismans' },
  { id: 'spirit-ash', name: 'Spirit Ash', group: 'other' },
  { id: 'great-rune', name: 'Great Rune', group: 'other' },
];

/** Which Item categories may go in a slot. `great-rune` is handled separately. */
export const SLOT_CATEGORIES: Readonly<Record<EquipSlotId, readonly ItemCategoryId[]>> = {
  'right-hand-1': ['melee-armaments', 'ranged-armaments', 'shields'],
  'right-hand-2': ['melee-armaments', 'ranged-armaments', 'shields'],
  'right-hand-3': ['melee-armaments', 'ranged-armaments', 'shields'],
  'left-hand-1': ['melee-armaments', 'ranged-armaments', 'shields'],
  'left-hand-2': ['melee-armaments', 'ranged-armaments', 'shields'],
  'left-hand-3': ['melee-armaments', 'ranged-armaments', 'shields'],
  head: ['head-armor'],
  chest: ['chest-armor'],
  arms: ['arms-armor'],
  legs: ['legs-armor'],
  'talisman-1': ['talismans'],
  'talisman-2': ['talismans'],
  'talisman-3': ['talismans'],
  'talisman-4': ['talismans'],
  'arrow-1': ['ammo'],
  'arrow-2': ['ammo'],
  'bolt-1': ['ammo'],
  'bolt-2': ['ammo'],
  'spirit-ash': ['spirit-ashes'],
  'great-rune': [],
};

/**
 * A Character's equipped items. `slots` maps an {@link EquipSlotId} to an Item
 * id; `spells` is the memorised-spell list; `ashesOfWar` maps an armament slot
 * id to an Ash of War item id; `armamentBuilds` maps an armament/shield slot
 * to its upgrade level/path, Affinity and two-handed choice, which drive
 * Attack Rating (see CONTEXT.md → "Attack Rating"). One Loadout per Character.
 */
export interface Loadout {
  slots: Partial<Record<EquipSlotId, string>>;
  spells: string[];
  ashesOfWar: Partial<Record<EquipSlotId, string>>;
  armamentBuilds: Partial<Record<EquipSlotId, ArmamentBuild>>;
}

export const EMPTY_LOADOUT: Loadout = {
  slots: {},
  spells: [],
  ashesOfWar: {},
  armamentBuilds: {},
};

export const ARMAMENT_SLOTS: readonly EquipSlotId[] = [
  'right-hand-1',
  'right-hand-2',
  'right-hand-3',
  'left-hand-1',
  'left-hand-2',
  'left-hand-3',
];
