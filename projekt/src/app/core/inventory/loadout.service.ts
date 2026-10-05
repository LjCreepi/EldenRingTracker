import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { EMPTY_LOADOUT, EquipSlotId, Loadout } from '../models/loadout.model';
import { ArmamentBuild, defaultArmamentBuild } from '../models/weapon-build.model';
import { StorageService } from '../storage/storage.service';

const STORAGE_KEY = 'loadout';

/** `{ [characterId]: Loadout }` */
type LoadoutStore = Record<string, Loadout>;

/**
 * The active Character's equipped Items — one per slot, plus the memorised-spell
 * list and per-armament Ashes of War. One Loadout per Character.
 * See CONTEXT.md → "Loadout".
 */
@Injectable({ providedIn: 'root' })
export class LoadoutService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);

  private readonly store = signal<LoadoutStore>(
    this.storage.read<LoadoutStore>(STORAGE_KEY, {}),
  );

  readonly loadout = computed<Loadout>(() => {
    const own = this.store()[this.characters.activeId()];
    if (!own) return EMPTY_LOADOUT;
    return {
      slots: own.slots ?? {},
      spells: own.spells ?? [],
      ashesOfWar: own.ashesOfWar ?? {},
      armamentBuilds: own.armamentBuilds ?? {},
    };
  });

  readonly equippedItemIds = computed<readonly string[]>(() => {
    const l = this.loadout();
    return [
      ...Object.values(l.slots),
      ...l.spells,
      ...Object.values(l.ashesOfWar),
    ].filter((id): id is string => !!id);
  });

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.store()));
  }

  slot(id: EquipSlotId): string | undefined {
    return this.loadout().slots[id];
  }

  equip(slotId: EquipSlotId, itemId: string | null): void {
    this.patch((l) => {
      const previousId = l.slots[slotId];
      const slots = { ...l.slots };
      if (itemId) slots[slotId] = itemId;
      else delete slots[slotId];
      // Dropping an armament also drops the Ash of War assigned to it.
      const ashesOfWar = { ...l.ashesOfWar };
      if (!itemId) delete ashesOfWar[slotId];
      // Swapping in a different item resets its build (upgrade/affinity/two-hand)
      // — those belong to the specific weapon, not the slot.
      const armamentBuilds = { ...l.armamentBuilds };
      if (itemId !== previousId) {
        if (itemId) armamentBuilds[slotId] = defaultArmamentBuild(itemId);
        else delete armamentBuilds[slotId];
      }
      return { ...l, slots, ashesOfWar, armamentBuilds };
    });
  }

  armamentBuild(slotId: EquipSlotId): ArmamentBuild | undefined {
    return this.loadout().armamentBuilds[slotId];
  }

  setArmamentBuild(slotId: EquipSlotId, build: ArmamentBuild): void {
    this.patch((l) => ({
      ...l,
      armamentBuilds: { ...l.armamentBuilds, [slotId]: build },
    }));
  }

  setAshOfWar(armamentSlot: EquipSlotId, itemId: string | null): void {
    this.patch((l) => {
      const ashesOfWar = { ...l.ashesOfWar };
      if (itemId) ashesOfWar[armamentSlot] = itemId;
      else delete ashesOfWar[armamentSlot];
      return { ...l, ashesOfWar };
    });
  }

  addSpell(itemId: string): void {
    this.patch((l) =>
      l.spells.includes(itemId) ? l : { ...l, spells: [...l.spells, itemId] },
    );
  }

  removeSpell(itemId: string): void {
    this.patch((l) => ({ ...l, spells: l.spells.filter((s) => s !== itemId) }));
  }

  /** Wipes the active Character's loadout. */
  resetActive(): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({
      ...current,
      [characterId]: EMPTY_LOADOUT,
    }));
  }

  /** Drops a Character's loadout entirely (used when it is deleted). */
  removeCharacter(characterId: string): void {
    this.store.update((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }

  private patch(change: (l: Loadout) => Loadout): void {
    const characterId = this.characters.activeId();
    this.store.update((current) => ({
      ...current,
      [characterId]: change(current[characterId] ?? EMPTY_LOADOUT),
    }));
  }
}
