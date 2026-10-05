import { Component, computed, inject, signal } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonMenuButton,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, close } from 'ionicons/icons';

import { AddItemsComponent } from '../../components/add-items/add-items.component';
import { InventoryRowComponent } from '../../components/inventory-row/inventory-row.component';
import { ItemDetailComponent } from '../../components/item-detail/item-detail.component';
import { MenuDockButtonComponent } from '../../components/menu-dock-button/menu-dock-button.component';
import { ItemCatalogService } from '../../core/catalog/item-catalog.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { compactLayout } from '../../core/layout/compact-layout';
import { Item, ItemCategoryId } from '../../core/models/item.model';

/**
 * The Inventory screen — a live mirror of what the active Character holds, laid
 * out like Elden Ring's inventory: a category rail, the held items for that
 * category, and (wide screens) a detail pane beside the list. The ＋ on a row
 * bumps its quantity; the toolbar ＋ opens the Add-items catalog browser.
 * See CONTEXT.md → "Inventory".
 */
@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  host: { '[class.compact]': 'compact()' },
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonMenuButton,
    MenuDockButtonComponent,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonList,
    IonLabel,
    IonIcon,
    InventoryRowComponent,
    ItemDetailComponent,
  ],
})
export class InventoryPage {
  protected readonly catalog = inject(ItemCatalogService);
  protected readonly inventory = inject(InventoryService);
  private readonly modalCtrl = inject(ModalController);

  protected readonly compact = compactLayout;

  protected readonly categories = this.catalog.categories;
  protected readonly activeCategory = signal<ItemCategoryId | null>(null);
  protected readonly selected = signal<Item | null>(null);

  /** Held items in the active category (or across all if none picked yet). */
  protected readonly rows = computed<Item[]>(() => {
    const held = this.inventory.held();
    const cat = this.activeCategory();
    return this.catalog
      .items()
      .filter((i) => held.has(i.id) && (cat ? i.category === cat : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly heldInCategory = computed(() => {
    const held = this.inventory.held();
    const counts = new Map<ItemCategoryId, number>();
    for (const item of this.catalog.items()) {
      if (held.has(item.id)) {
        counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
      }
    }
    return counts;
  });

  constructor() {
    addIcons({ add, close });
  }

  protected pickCategory(value: unknown): void {
    this.activeCategory.set((value as ItemCategoryId) || null);
    this.selected.set(null);
  }

  protected select(item: Item): void {
    this.selected.set(this.selected()?.id === item.id ? null : item);
  }

  protected async openAdd(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddItemsComponent,
      componentProps: { category: this.activeCategory() },
    });
    await modal.present();
  }
}
