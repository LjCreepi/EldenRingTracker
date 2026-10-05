import { Injectable, inject } from '@angular/core';
import { ItemCatalogService } from './item-catalog.service';
import { WarmupCacheService } from './warmup-cache.service';

const STORAGE_KEY = 'itemAssetsCachedVersion';

/**
 * Warms every Item Catalog icon into the cache once per catalog version, so the
 * Character screens render instantly and work offline. The service worker's
 * `item-icons` group is `lazy` + `updateMode: lazy`, so simply `fetch()`ing each
 * URL stores it, and an unchanged version on a later launch does nothing.
 *
 * Mirrors {@link MapTileCacheService} (both extend {@link WarmupCacheService}).
 * See CONTEXT.md → "Item Asset Cache".
 */
@Injectable({ providedIn: 'root' })
export class ItemAssetCacheService extends WarmupCacheService {
  private readonly catalog = inject(ItemCatalogService);
  protected readonly storageKey = STORAGE_KEY;

  protected catalogVersion(): string | null {
    return this.catalog.version();
  }

  protected urls(): string[] {
    return [
      ...new Set(
        this.catalog
          .items()
          .map((i) => i.icon)
          .filter((u): u is string => !!u),
      ),
    ];
  }
}
