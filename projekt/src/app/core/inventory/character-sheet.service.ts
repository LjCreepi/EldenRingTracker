import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { DEFAULT_CLASS_ID } from '../models/character.model';
import {
  AttributeId,
  Attributes,
  CharacterSheet,
  defaultSheet,
  startingClass,
} from '../models/character-sheet.model';
import { derivedLevel } from '../../features/character/stats';
import { StorageService } from '../storage/storage.service';

const STORAGE_KEY = 'characterSheet';

/** `{ [characterId]: CharacterSheet }` */
type SheetStore = Record<string, CharacterSheet>;

/**
 * The active Character's eight Attribute values. The starting Class comes from
 * the Character (fixed at creation — docs/adr/0006); this service only tracks
 * the points raised on top of that class base. Derived stats are computed
 * elsewhere (src/app/features/character/stats.ts).
 * See CONTEXT.md → "Character Sheet".
 */
@Injectable({ providedIn: 'root' })
export class CharacterSheetService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);

  private readonly store = signal<SheetStore>(this.load());

  /** The active Character's fixed starting class. */
  readonly classId = computed(
    () => this.characters.activeCharacter()?.classId ?? DEFAULT_CLASS_ID,
  );
  readonly startingClass = computed(() => startingClass(this.classId()));

  readonly sheet = computed<CharacterSheet>(
    () => this.store()[this.characters.activeId()] ?? defaultSheet(this.classId()),
  );

  /** Exact character Level from the class base plus points invested. */
  readonly level = computed(() =>
    derivedLevel(this.sheet().attributes, this.startingClass()),
  );

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.store()));
  }

  /** Level of any Character (for the switcher), or its class base if unraised. */
  levelOf(characterId: string): number {
    const classId =
      this.characters.characters().find((c) => c.id === characterId)?.classId ??
      DEFAULT_CLASS_ID;
    const cls = startingClass(classId);
    return derivedLevel(this.store()[characterId]?.attributes ?? cls.attributes, cls);
  }

  setAttribute(id: AttributeId, value: number): void {
    const base = this.startingClass().attributes[id];
    const clamped = Math.min(99, Math.max(base, Math.floor(value || base)));
    this.write({
      attributes: { ...this.sheet().attributes, [id]: clamped },
    });
  }

  adjustAttribute(id: AttributeId, delta: number): void {
    this.setAttribute(id, this.sheet().attributes[id] + delta);
  }

  /** Reset the active Character's attributes to its class base. */
  resetActive(): void {
    this.removeCharacter(this.characters.activeId());
  }

  /** Drop a Character's sheet entirely (used when the Character is deleted). */
  removeCharacter(characterId: string): void {
    this.store.update((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }

  private write(sheet: CharacterSheet): void {
    const characterId = this.characters.activeId();
    if (!characterId) return;
    this.store.update((current) => ({ ...current, [characterId]: sheet }));
  }

  private load(): SheetStore {
    const raw = this.storage.read<Record<string, Partial<CharacterSheet> & { classId?: string }>>(
      STORAGE_KEY,
      {},
    );
    // Drop any legacy `classId` key left on a stored sheet (docs/adr/0006).
    const cleaned: SheetStore = {};
    for (const [id, sheet] of Object.entries(raw)) {
      if (sheet?.attributes) cleaned[id] = { attributes: sheet.attributes as Attributes };
    }
    return cleaned;
  }
}
