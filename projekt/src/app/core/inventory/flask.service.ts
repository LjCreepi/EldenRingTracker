import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { InventoryService } from './inventory.service';
import { StorageService } from '../storage/storage.service';
import {
  FLASK_POTENCY_MAX_TIER,
  flaskCharges,
  flaskPotencyTier,
} from '../../features/character/stats';

const STORAGE_KEY = 'flaskUsage';
const GOLDEN_SEED_ITEM = 'golden-seed';
const SACRED_TEAR_ITEM = 'sacred-tear';

interface FlaskUsage {
  readonly goldenSeedsUsed: number;
  readonly sacredTearsUsed: number;
}

const EMPTY_USAGE: FlaskUsage = { goldenSeedsUsed: 0, sacredTearsUsed: 0 };

/** `{ [characterId]: FlaskUsage }` */
type FlaskUsageStore = Record<string, FlaskUsage>;

/**
 * How many Golden Seeds / Sacred Tears a Character has actually *used* at a
 * Site of Grace — separate from how many are sitting in Inventory (see
 * CONTEXT.md → "Golden Seed" / "Sacred Tear"). Using one moves it out of
 * Inventory permanently and raises the Flask Charges / Flask Potency Derived
 * Stats; un-using restores it to Inventory, for correcting mistakes.
 */
@Injectable({ providedIn: 'root' })
export class FlaskService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);
  private readonly inventory = inject(InventoryService);

  private readonly store = signal<FlaskUsageStore>(
    this.storage.read<FlaskUsageStore>(STORAGE_KEY, {}),
  );

  private readonly usage = computed<FlaskUsage>(
    () => this.store()[this.characters.activeId()] ?? EMPTY_USAGE,
  );

  readonly goldenSeedsUsed = computed(() => this.usage().goldenSeedsUsed);
  readonly sacredTearsUsed = computed(() => this.usage().sacredTearsUsed);
  readonly goldenSeedsHeld = computed(() => this.inventory.quantity(GOLDEN_SEED_ITEM));
  readonly sacredTearsHeld = computed(() => this.inventory.quantity(SACRED_TEAR_ITEM));

  readonly flaskCharges = computed(() => flaskCharges(this.goldenSeedsUsed()));
  readonly flaskPotencyTier = computed(() => flaskPotencyTier(this.sacredTearsUsed()));
  readonly flaskPotencyMaxTier = FLASK_POTENCY_MAX_TIER;

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.store()));
  }

  /** Uses one held Golden Seed, if any are held. */
  useGoldenSeed(): void {
    if (this.goldenSeedsHeld() <= 0) return;
    this.inventory.adjust(GOLDEN_SEED_ITEM, -1);
    this.patch((u) => ({ ...u, goldenSeedsUsed: u.goldenSeedsUsed + 1 }));
  }

  /** Reverses one used Golden Seed, restoring it to Inventory. */
  unuseGoldenSeed(): void {
    if (this.goldenSeedsUsed() <= 0) return;
    this.inventory.adjust(GOLDEN_SEED_ITEM, 1);
    this.patch((u) => ({ ...u, goldenSeedsUsed: u.goldenSeedsUsed - 1 }));
  }

  /** Uses one held Sacred Tear, if any are held. */
  useSacredTear(): void {
    if (this.sacredTearsHeld() <= 0) return;
    this.inventory.adjust(SACRED_TEAR_ITEM, -1);
    this.patch((u) => ({ ...u, sacredTearsUsed: u.sacredTearsUsed + 1 }));
  }

  /** Reverses one used Sacred Tear, restoring it to Inventory. */
  unuseSacredTear(): void {
    if (this.sacredTearsUsed() <= 0) return;
    this.inventory.adjust(SACRED_TEAR_ITEM, 1);
    this.patch((u) => ({ ...u, sacredTearsUsed: u.sacredTearsUsed - 1 }));
  }

  /** Wipes the active Character's Flask usage. */
  resetActive(): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({ ...current, [characterId]: EMPTY_USAGE }));
  }

  /** Drops a Character's Flask usage entirely (used when it is deleted). */
  removeCharacter(characterId: string): void {
    this.store.update((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }

  private patch(change: (u: FlaskUsage) => FlaskUsage): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({
      ...current,
      [characterId]: change(current[characterId] ?? EMPTY_USAGE),
    }));
  }
}
