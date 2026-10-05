import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  Character,
  DEFAULT_CLASS_ID,
  StoredCharacter,
} from '../models/character.model';
import { startingClass } from '../models/character-sheet.model';
import { censorName, normalizeName } from '../../features/character/name';
import { StorageService } from '../storage/storage.service';

const CHARACTERS_KEY = 'characters';
const ACTIVE_KEY = 'activeCharacter';
/** Read once, for the 0.4.0 → class-on-Character migration only. */
const LEGACY_SHEET_KEY = 'characterSheet';

/** The stored shape before `classId` / `rawName` existed (≤ 0.4.0). */
interface LegacyCharacter {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
}

/**
 * Owns the set of Characters and which one is active. Creation, switching,
 * renaming (via the Mirror) and deletion all live here; the per-Character stores
 * (progress, inventory, loadout, sheet) key off `activeId()`.
 *
 * There is no auto-created Character any more — when `characters()` is empty the
 * app shell shows the Onboarding Wizard instead. See CONTEXT.md → "Character".
 */
@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly storage = inject(StorageService);

  private readonly stored = signal<StoredCharacter[]>(this.load());
  private readonly activeIdState = signal<string>(this.loadActiveId());

  /** Public view: every `name` is already the Censored Name. */
  readonly characters = computed<Character[]>(() =>
    this.stored().map((c) => this.toPublic(c)),
  );
  readonly activeId = this.activeIdState.asReadonly();
  readonly activeCharacter = computed<Character | undefined>(() => {
    const list = this.characters();
    return list.find((c) => c.id === this.activeIdState()) ?? list[0];
  });
  readonly hasAny = computed(() => this.stored().length > 0);

  constructor() {
    effect(() => this.storage.write(CHARACTERS_KEY, this.stored()));
    effect(() => this.storage.write(ACTIVE_KEY, this.activeIdState()));
  }

  /** The name as typed — for the rename prefill and the delete-confirm check. */
  rawName(id: string): string {
    return this.stored().find((c) => c.id === id)?.rawName ?? '';
  }

  /** Create a Character and make it active. Returns its id. */
  create(rawName: string, classId: string): string {
    const character: StoredCharacter = {
      id: crypto.randomUUID(),
      rawName: normalizeName(rawName),
      classId: startingClass(classId).id,
      createdAt: new Date().toISOString(),
    };
    this.stored.update((list) => [...list, character]);
    this.activeIdState.set(character.id);
    return character.id;
  }

  /** Rename (the Mirror). No-op on an empty name — callers validate first. */
  rename(id: string, rawName: string): void {
    const next = normalizeName(rawName);
    if (!next) return;
    this.stored.update((list) =>
      list.map((c) => (c.id === id ? { ...c, rawName: next } : c)),
    );
  }

  setActive(id: string): void {
    if (this.stored().some((c) => c.id === id)) this.activeIdState.set(id);
  }

  /**
   * Delete a Character from the list and repoint `activeId` if it was the one
   * removed (to the most recently created survivor, or nothing). Cascading the
   * per-Character stores is the caller's job — see the Characters screen, which
   * orchestrates it the way SettingsPage does its resets.
   */
  remove(id: string): void {
    this.stored.update((list) => list.filter((c) => c.id !== id));
    if (this.activeIdState() === id) {
      // The list stays in creation order, so the last entry is the newest.
      const list = this.stored();
      this.activeIdState.set(list.length ? list[list.length - 1].id : '');
    }
  }

  private toPublic(c: StoredCharacter): Character {
    return {
      id: c.id,
      name: censorName(c.rawName),
      classId: c.classId,
      createdAt: c.createdAt,
    };
  }

  private load(): StoredCharacter[] {
    const raw = this.storage.read<(StoredCharacter | LegacyCharacter)[]>(
      CHARACTERS_KEY,
      [],
    );
    if (raw.length === 0) return [];

    const needsMigration = raw.some((c) => !('rawName' in c));
    const legacyClassIds = needsMigration
      ? this.storage.read<Record<string, { classId?: string }>>(
          LEGACY_SHEET_KEY,
          {},
        )
      : {};

    const migrated = raw.map((c): StoredCharacter =>
      'rawName' in c
        ? c
        : {
            id: c.id,
            rawName: c.name,
            classId: legacyClassIds[c.id]?.classId ?? DEFAULT_CLASS_ID,
            createdAt: c.createdAt,
          },
    );
    if (needsMigration) this.storage.write(CHARACTERS_KEY, migrated);
    return migrated;
  }

  private loadActiveId(): string {
    const list = this.stored();
    if (list.length === 0) return '';
    const storedId = this.storage.read<string | null>(ACTIVE_KEY, null);
    return storedId && list.some((c) => c.id === storedId)
      ? storedId
      : list[0].id;
  }
}
