import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Item,
  ItemCatalog,
  ItemCategoryDef,
  ItemCategoryId,
  ITEM_CATEGORY_ORDER,
} from '../models/item.model';

/**
 * Loads and holds the read-only Item Catalog, a static asset built by
 * `scripts/fetch-item-catalog.mjs`. Mirrors {@link MarkerCatalogService}.
 * See CONTEXT.md → "Item Catalog" and docs/adr/0004.
 */
@Injectable({ providedIn: 'root' })
export class ItemCatalogService {
  private readonly http = inject(HttpClient);

  private readonly catalog = signal<ItemCatalog | null>(null);

  readonly loaded = computed(() => this.catalog() !== null);
  readonly version = computed(() => this.catalog()?.version ?? null);
  readonly items = computed<readonly Item[]>(() => this.catalog()?.items ?? []);

  /** Category defs in Elden Ring's tab order, empty ones dropped. */
  readonly categories = computed<readonly ItemCategoryDef[]>(() => {
    const defs = this.catalog()?.categories ?? [];
    const present = new Set(this.items().map((i) => i.category));
    const byId = new Map(defs.map((d) => [d.id, d]));
    return ITEM_CATEGORY_ORDER.filter((id) => present.has(id) && byId.has(id)).map(
      (id) => byId.get(id)!,
    );
  });

  private readonly byId = computed(
    () => new Map(this.items().map((i) => [i.id, i])),
  );

  async load(): Promise<void> {
    if (this.catalog()) return;
    const catalog = await firstValueFrom(
      this.http.get<ItemCatalog>(environment.itemCatalogUrl),
    );
    this.catalog.set(catalog);
  }

  item(id: string): Item | undefined {
    return this.byId().get(id);
  }

  itemsInCategory(category: ItemCategoryId): Item[] {
    return this.items()
      .filter((i) => i.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  categoryName(id: ItemCategoryId): string {
    return this.catalog()?.categories.find((c) => c.id === id)?.name ?? id;
  }
}
