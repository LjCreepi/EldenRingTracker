import { Component, Input, computed, inject, signal } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';

import { ItemCatalogService } from '../../core/catalog/item-catalog.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import {
  Item,
  ItemCategoryId,
  ITEM_ICON_PLACEHOLDER,
} from '../../core/models/item.model';

const PAGE = 40;

/**
 * The Add-items screen: browse the whole Item Catalog for one category, filter
 * out what you already hold (the "not yet held" filter — on by default), and
 * add with the ＋ on each row. Presented as a modal from the Inventory page.
 *
 * The catalog has ~1,900 items, so the list is paged behind an
 * `ion-infinite-scroll` — rendering them all at once is what made the button
 * feel slow. See CONTEXT.md → "Inventory".
 */
@Component({
  selector: 'app-add-items',
  templateUrl: './add-items.component.html',
  styleUrls: ['./add-items.component.scss'],
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
    IonText,
    IonIcon,
    IonThumbnail,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class AddItemsComponent {
  private readonly catalog = inject(ItemCatalogService);
  protected readonly inventory = inject(InventoryService);
  private readonly modalCtrl = inject(ModalController);

  /** Restrict to one category; unset = the whole catalog. Set via modal props. */
  @Input() category: ItemCategoryId | null = null;

  protected readonly query = signal('');
  protected readonly hideHeld = signal(true);
  protected readonly limit = signal(PAGE);
  protected readonly placeholder = ITEM_ICON_PLACEHOLDER;

  protected readonly title = computed(() => {
    const c = this.category;
    return c ? `Add — ${this.catalog.categoryName(c)}` : 'Add items';
  });

  private readonly matches = computed<Item[]>(() => {
    const c = this.category;
    const q = this.query().trim().toLowerCase();
    const held = this.inventory.held();
    return this.catalog
      .items()
      .filter((i) => (c ? i.category === c : true))
      .filter((i) => (this.hideHeld() ? !held.has(i.id) : true))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly total = computed(() => this.matches().length);
  protected readonly shown = computed(() => this.matches().slice(0, this.limit()));
  protected readonly hasMore = computed(() => this.limit() < this.total());

  constructor() {
    addIcons({ add, remove });
  }

  protected iconFor(item: Item): string {
    return item.icon ?? ITEM_ICON_PLACEHOLDER;
  }

  /** Reset the paging window whenever the filter changes. */
  protected setQuery(value: string): void {
    this.query.set(value);
    this.limit.set(PAGE);
  }

  protected setHideHeld(value: boolean): void {
    this.hideHeld.set(value);
    this.limit.set(PAGE);
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    this.limit.update((n) => n + PAGE);
    void event.target.complete();
  }

  protected close(): void {
    void this.modalCtrl.dismiss();
  }
}
