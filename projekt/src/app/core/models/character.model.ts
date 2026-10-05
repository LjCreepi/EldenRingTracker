/**
 * A single save / run of the game being tracked. Owns all of its Completion
 * records, its Inventory, its Loadout and its Character Sheet, plus a name and a
 * starting Class fixed at creation. See CONTEXT.md → "Character".
 */

/** A Character as persisted in `localStorage`. */
export interface StoredCharacter {
  readonly id: string;
  /** The name exactly as typed (trimmed, ≤ 16 chars). Never shown as-is. */
  readonly rawName: string;
  /** A `STARTING_CLASSES` id. Chosen once, at creation — never changes. */
  readonly classId: string;
  /** ISO timestamp. */
  readonly createdAt: string;
}

/**
 * A Character as the rest of the app consumes it: `name` is already the Censored
 * Name, so no call site has to remember to filter it. The raw name is reachable
 * only through `CharacterService.rawName(id)`. See CONTEXT.md → "Censored Name".
 */
export interface Character {
  readonly id: string;
  /** Already run through `censorName()`. */
  readonly name: string;
  readonly classId: string;
  readonly createdAt: string;
}

export const DEFAULT_CHARACTER_NAME = 'Tarnished';
export const DEFAULT_CLASS_ID = 'vagabond';
