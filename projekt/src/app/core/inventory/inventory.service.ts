import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { StorageService } from '../storage/storage.service';

const STORAGE_KEY = 'inventory';

/** `{ [characterId]: { [itemId]: quantity } }` */
type InventoryStore = Record<string, Record<string, number>>;

/**
 * The Items a Character currently holds and how many. A live mirror the user
 * keeps by hand — quantities go up *and* down; quantity 0 means "not held".
 * See CONTEXT.md → "Inventory".
 */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);

  private readonly store = signal<InventoryStore>(
    this.storage.read<InventoryStore>(STORAGE_KEY, {}),
  );

  /** `itemId → quantity` for the active Character, held items only. */
  readonly held = computed<ReadonlyMap<string, number>>(() => {
    const own = this.store()[this.characters.activeId()] ?? {};
    return new Map(
      Object.entries(own).filter(([, qty]) => qty > 0),
    );
  });

  /** Number of distinct Items held. */
  readonly heldCount = computed(() => this.held().size);

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.store()));
  }

  quantity(itemId: string): number {
    return this.held().get(itemId) ?? 0;
  }

  has(itemId: string): boolean {
    return this.quantity(itemId) > 0;
  }

  /** How many of `itemIds` are held (for per-category counts). */
  heldOf(itemIds: readonly string[]): number {
    const held = this.held();
    return itemIds.reduce((n, id) => (held.has(id) ? n + 1 : n), 0);
  }

  setQuantity(itemId: string, quantity: number): void {
    const qty = Math.max(0, Math.floor(quantity || 0));
    const characterId = this.characters.activeId();
    this.store.update((current) => {
      const own = { ...(current[characterId] ?? {}) };
      if (qty === 0) delete own[itemId];
      else own[itemId] = qty;
      return { ...current, [characterId]: own };
    });
  }

  adjust(itemId: string, delta: number): void {
    this.setQuantity(itemId, this.quantity(itemId) + delta);
  }

  add(itemId: string, quantity = 1): void {
    this.setQuantity(itemId, this.quantity(itemId) + Math.max(1, quantity));
  }

  remove(itemId: string): void {
    this.setQuantity(itemId, 0);
  }

  /** Wipes the active Character's inventory. */
  resetActive(): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({ ...current, [characterId]: {} }));
  }

  /** Drops a Character's inventory entirely (used when it is deleted). */
  removeCharacter(characterId: string): void {
    this.store.update((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }
}
