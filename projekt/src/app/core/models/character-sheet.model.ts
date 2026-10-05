/**
 * A Character's starting Class and eight Attributes. Everything on the status
 * screen below the attributes is a Derived Stat computed from this plus the
 * Loadout — see src/app/features/character/stats.ts and docs/adr/0005.
 * See CONTEXT.md → "Character Sheet".
 */

export type AttributeId =
  | 'vigor'
  | 'mind'
  | 'endurance'
  | 'strength'
  | 'dexterity'
  | 'intelligence'
  | 'faith'
  | 'arcane';

export const ATTRIBUTE_IDS: readonly AttributeId[] = [
  'vigor',
  'mind',
  'endurance',
  'strength',
  'dexterity',
  'intelligence',
  'faith',
  'arcane',
];

export const ATTRIBUTE_NAMES: Readonly<Record<AttributeId, string>> = {
  vigor: 'Vigor',
  mind: 'Mind',
  endurance: 'Endurance',
  strength: 'Strength',
  dexterity: 'Dexterity',
  intelligence: 'Intelligence',
  faith: 'Faith',
  arcane: 'Arcane',
};

export type Attributes = Readonly<Record<AttributeId, number>>;

export interface StartingClass {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly attributes: Attributes;
}

/**
 * The ten base-game starting classes, hardcoded — the Fan API's `classes`
 * endpoint lists classes that do not exist in the game.
 */
export const STARTING_CLASSES: readonly StartingClass[] = [
  { id: 'vagabond', name: 'Vagabond', level: 9, attributes: { vigor: 15, mind: 10, endurance: 11, strength: 14, dexterity: 13, intelligence: 9, faith: 9, arcane: 7 } },
  { id: 'warrior', name: 'Warrior', level: 8, attributes: { vigor: 11, mind: 12, endurance: 11, strength: 10, dexterity: 16, intelligence: 10, faith: 8, arcane: 9 } },
  { id: 'hero', name: 'Hero', level: 7, attributes: { vigor: 14, mind: 9, endurance: 12, strength: 16, dexterity: 9, intelligence: 7, faith: 8, arcane: 11 } },
  { id: 'bandit', name: 'Bandit', level: 5, attributes: { vigor: 10, mind: 11, endurance: 10, strength: 9, dexterity: 13, intelligence: 9, faith: 8, arcane: 14 } },
  { id: 'astrologer', name: 'Astrologer', level: 6, attributes: { vigor: 9, mind: 15, endurance: 9, strength: 8, dexterity: 12, intelligence: 16, faith: 7, arcane: 9 } },
  { id: 'prophet', name: 'Prophet', level: 7, attributes: { vigor: 10, mind: 14, endurance: 8, strength: 11, dexterity: 10, intelligence: 7, faith: 16, arcane: 10 } },
  { id: 'confessor', name: 'Confessor', level: 10, attributes: { vigor: 10, mind: 13, endurance: 10, strength: 12, dexterity: 12, intelligence: 9, faith: 14, arcane: 9 } },
  { id: 'samurai', name: 'Samurai', level: 9, attributes: { vigor: 12, mind: 11, endurance: 13, strength: 12, dexterity: 15, intelligence: 9, faith: 8, arcane: 8 } },
  { id: 'prisoner', name: 'Prisoner', level: 9, attributes: { vigor: 11, mind: 12, endurance: 11, strength: 11, dexterity: 14, intelligence: 14, faith: 6, arcane: 9 } },
  { id: 'wretch', name: 'Wretch', level: 1, attributes: { vigor: 10, mind: 10, endurance: 10, strength: 10, dexterity: 10, intelligence: 10, faith: 10, arcane: 10 } },
];

export function startingClass(id: string): StartingClass {
  return STARTING_CLASSES.find((c) => c.id === id) ?? STARTING_CLASSES[0];
}

/**
 * A Character's eight Attribute values. The starting Class lives on the
 * Character (see docs/adr/0006), not here — resolve it via `CharacterService`.
 */
export interface CharacterSheet {
  readonly attributes: Attributes;
}

/** A fresh sheet: the class's base spread, ready to be raised. */
export function defaultSheet(classId = 'vagabond'): CharacterSheet {
  return { attributes: { ...startingClass(classId).attributes } };
}

/** The seven restorable Great Runes (base game). */
export const GREAT_RUNES: readonly { id: string; name: string }[] = [
  { id: 'godrick', name: "Godrick's Great Rune" },
  { id: 'radahn', name: "Radahn's Great Rune" },
  { id: 'morgott', name: "Morgott's Great Rune" },
  { id: 'rykard', name: "Rykard's Great Rune" },
  { id: 'mohg', name: "Mohg's Great Rune" },
  { id: 'malenia', name: "Malenia's Great Rune" },
  { id: 'unborn', name: 'Great Rune of the Unborn' },
];

export const DEFAULT_MEMORY_SLOTS = 10;
