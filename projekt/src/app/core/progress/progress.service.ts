import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { Marker } from '../models/marker.model';
import { StorageService } from '../storage/storage.service';
import { MarkerCatalogService } from '../catalog/marker-catalog.service';
import { InventoryService } from '../inventory/inventory.service';

const STORAGE_KEY = 'completion';

/** `{ [characterId]: markerId[] }` */
type CompletionStore = Record<string, string[]>;

/**
 * Tracks which completable Markers have been dealt with, per Character.
 * See CONTEXT.md → "Completion".
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);
  private readonly markerCatalog = inject(MarkerCatalogService);
  private readonly inventory = inject(InventoryService);

  private readonly store = signal<CompletionStore>(
    this.storage.read<CompletionStore>(STORAGE_KEY, {}),
  );

  /** Completed marker ids for the active Character. */
  readonly completed = computed<ReadonlySet<string>>(
    () => new Set(this.store()[this.characters.activeId()] ?? []),
  );

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.store()));
  }

  isComplete(markerId: string): boolean {
    return this.completed().has(markerId);
  }

  /**
   * Toggles a Marker's Completion. When the Marker links to an Item
   * (`Marker.itemId` — today only Golden Seed / Sacred Tear markers), this also
   * adds or removes one of that Item from Inventory, so map progress and
   * Inventory quantity never have to be kept in sync by hand.
   */
  toggle(markerId: string): void {
    const characterId = this.characters.activeId();
    const wasComplete = this.isComplete(markerId);
    this.store.update((current) => {
      const ids = new Set(current[characterId] ?? []);
      ids.has(markerId) ? ids.delete(markerId) : ids.add(markerId);
      return { ...current, [characterId]: [...ids] };
    });
    const itemId = this.markerCatalog.markers().find((m) => m.id === markerId)?.itemId;
    if (itemId) this.inventory.adjust(itemId, wasComplete ? -1 : 1);
  }

  /** How many of `markers` are complete for the active Character. */
  completedCount(markers: readonly Marker[]): number {
    const done = this.completed();
    return markers.reduce((n, m) => (done.has(m.id) ? n + 1 : n), 0);
  }

  /** Wipes progress for the active Character. */
  resetActive(): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({ ...current, [characterId]: [] }));
  }

  /** Drops a Character's progress entirely (used when it is deleted). */
  removeCharacter(characterId: string): void {
    this.store.update((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }
}
