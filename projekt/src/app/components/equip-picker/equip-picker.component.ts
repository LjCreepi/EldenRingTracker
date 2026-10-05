import { Component, Input, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';

import { ItemCatalogService } from '../../core/catalog/item-catalog.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { LoadoutService } from '../../core/inventory/loadout.service';
import {
  Item,
  ItemCategoryId,
  ITEM_ICON_PLACEHOLDER,
} from '../../core/models/item.model';
import { EquipSlotId, SLOT_CATEGORIES } from '../../core/models/loadout.model';
import { crystalTearEffectSummary } from '../../core/models/physick.model';

/**
 * Pick an Item for one equipment slot. Defaults to the Character's Inventory
 * (equipping what you actually have); the "Anything from the catalog" toggle
 * opens it up to the whole catalog for build-planning. Dismisses with the chosen
 * item id, `null` to unequip, or nothing on cancel.
 * See CONTEXT.md → "Loadout".
 */
@Component({
  selector: 'app-equip-picker',
  templateUrl: './equip-picker.component.html',
  styleUrls: ['./equip-picker.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonToggle,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonIcon,
    IonThumbnail,
  ],
})
export class EquipPickerComponent {
  private readonly catalog = inject(ItemCatalogService);
  private readonly inventory = inject(InventoryService);
  private readonly loadout = inject(LoadoutService);
  private readonly modalCtrl = inject(ModalController);

  /** All three are set via modal `componentProps`, so plain `@Input`s. */
  @Input({ required: true }) slotId!: EquipSlotId;
  /** For an Ash of War picker, the armament slot it's being applied to. */
  @Input() ashOfWarFor: EquipSlotId | null = null;
  /** Overrides the slot's default eligible categories (used for spell picking). */
  @Input() categories: readonly ItemCategoryId[] | null = null;
  /** Restricts results to exactly these Item ids (used for the Physick Mix). */
  @Input() itemIds: readonly string[] | null = null;
  /** The currently chosen item, when `itemIds` is used (no Loadout slot backs it). */
  @Input() currentId: string | null = null;

  protected readonly query = signal('');
  protected readonly anything = signal(false);
  protected readonly placeholder = ITEM_ICON_PLACEHOLDER;

  private allowedCategories(): readonly ItemCategoryId[] {
    if (this.categories) return this.categories;
    if (this.ashOfWarFor) return ['ashes-of-war'];
    return SLOT_CATEGORIES[this.slotId] ?? [];
  }

  protected get title(): string {
    return this.ashOfWarFor ? 'Ash of War' : 'Equip';
  }

  protected readonly equippedId = computed(() => {
    if (this.itemIds) return this.currentId ?? undefined;
    if (this.categories) return undefined;
    return this.ashOfWarFor
      ? this.loadout.loadout().ashesOfWar[this.ashOfWarFor]
      : this.loadout.slot(this.slotId);
  });

  protected readonly results = computed<Item[]>(() => {
    const allowed = new Set(this.allowedCategories());
    const q = this.query().trim().toLowerCase();
    const held = this.inventory.held();
    const isArrow = this.slotId.startsWith('arrow');
    const isBolt = this.slotId.startsWith('bolt');

    return this.catalog
      .items()
      .filter((i) => (this.itemIds ? this.itemIds.includes(i.id) : allowed.has(i.category)))
      .filter((i) => (isArrow ? i.ammoType !== 'bolt' : true))
      .filter((i) => (isBolt ? i.ammoType === 'bolt' : true))
      .filter((i) => (this.anything() ? true : held.has(i.id)))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    addIcons({ closeCircle });
  }

  protected iconFor(item: Item): string {
    return item.icon ?? ITEM_ICON_PLACEHOLDER;
  }

  protected inInventory(id: string): boolean {
    return this.inventory.has(id);
  }

  /** Only meaningful for the Physick Mix picker (`itemIds` mode). */
  protected effectSummary(item: Item): string | null {
    return this.itemIds ? crystalTearEffectSummary(item) : null;
  }

  protected choose(item: Item): void {
    void this.modalCtrl.dismiss(item.id, 'equip');
  }

  protected clear(): void {
    void this.modalCtrl.dismiss(null, 'equip');
  }

  protected cancel(): void {
    void this.modalCtrl.dismiss(undefined, 'cancel');
  }
}
