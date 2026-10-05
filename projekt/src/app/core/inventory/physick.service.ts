import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { StorageService } from '../storage/storage.service';
import { Attributes, AttributeId } from '../models/character-sheet.model';
import { CRYSTAL_TEAR_ATTRIBUTE_EFFECTS } from '../models/physick.model';

const STORAGE_KEY = 'physickMix';

/** A Character's Wondrous Physick mix: up to two Crystal Tear ids, plus
 * whether it's currently marked active (drunk). */
interface PhysickMix {
  readonly tears: readonly [string | null, string | null];
  readonly active: boolean;
}

const EMPTY_MIX: PhysickMix = { tears: [null, null], active: false };

/** `{ [characterId]: PhysickMix }` */
type PhysickStore = Record<string, PhysickMix>;

/**
 * The active Character's Wondrous Physick mix — which two Crystal Tears are
 * loaded, and whether it's toggled "active" so its effect previews against
 * the Character's stats. See CONTEXT.md → "Wondrous Physick".
 */
@Injectable({ providedIn: 'root' })
export class PhysickService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);

  private readonly store = signal<PhysickStore>(
    this.storage.read<PhysickStore>(STORAGE_KEY, {}),
  );

  readonly mix = computed<PhysickMix>(
    () => this.store()[this.characters.activeId()] ?? EMPTY_MIX,
  );

  readonly tearIds = computed(() => this.mix().tears);
  readonly active = computed(() => this.mix().active);

  /** Attribute deltas from the mixed tears, applied only while `active`. */
  readonly attributeDeltas = computed<Partial<Record<AttributeId, number>>>(() => {
    if (!this.active()) return {};
    const deltas: Partial<Record<AttributeId, number>> = {};
    for (const id of this.mix().tears) {
      const fx = id && CRYSTAL_TEAR_ATTRIBUTE_EFFECTS[id];
      if (fx) deltas[fx.attribute] = (deltas[fx.attribute] ?? 0) + fx.amount;
    }
    return deltas;
  });

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.store()));
  }

  /** Attributes with the active mix's deltas applied — for feeding derived stats. */
  effectiveAttributes(base: Attributes): Attributes {
    const deltas = this.attributeDeltas();
    if (!Object.keys(deltas).length) return base;
    const out = { ...base };
    for (const [id, delta] of Object.entries(deltas)) {
      out[id as AttributeId] = out[id as AttributeId] + (delta ?? 0);
    }
    return out;
  }

  setTear(slot: 0 | 1, itemId: string | null): void {
    this.patch((m) => {
      const tears: [string | null, string | null] = [...m.tears];
      tears[slot] = itemId;
      return { ...m, tears };
    });
  }

  setActive(active: boolean): void {
    this.patch((m) => ({ ...m, active }));
  }

  toggleActive(): void {
    this.setActive(!this.active());
  }

  /** Wipes the active Character's Physick mix. */
  resetActive(): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({ ...current, [characterId]: EMPTY_MIX }));
  }

  /** Drops a Character's Physick mix entirely (used when it is deleted). */
  removeCharacter(characterId: string): void {
    this.store.update((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }

  private patch(change: (m: PhysickMix) => PhysickMix): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({
      ...current,
      [characterId]: change(current[characterId] ?? EMPTY_MIX),
    }));
  }
}
