import { Injectable, inject } from '@angular/core';
import { MarkerCatalogService } from './marker-catalog.service';
import { WarmupCacheService } from './warmup-cache.service';

const STORAGE_KEY = 'tilesCachedVersion';

/**
 * Warms every map tile — **both** the surface and the underground pyramids —
 * into the cache so the map still works offline instead of showing black gaps.
 * The Angular service worker's `map-tiles` group is `lazy`, so simply fetching
 * each tile URL is enough for it to be stored.
 *
 * Mirrors {@link ItemAssetCacheService} (both extend {@link WarmupCacheService}).
 * `firstRun` distinguishes the very first warm-up (nothing cached yet — show a
 * blocking screen) from refreshing an older cached version (warm quietly in the
 * background).
 */
@Injectable({ providedIn: 'root' })
export class MapTileCacheService extends WarmupCacheService {
  private readonly catalog = inject(MarkerCatalogService);
  protected readonly storageKey = STORAGE_KEY;

  protected catalogVersion(): string | null {
    return this.catalog.version();
  }

  /** Every `{z}/{y}/{x}.webp` URL present in the tile index, both layers. */
  protected urls(): string[] {
    const index = this.catalog.tileIndex();
    if (!index) return [];
    const urls: string[] = [];
    for (const [layer, perZoom] of Object.entries(index)) {
      for (const [z, pairs] of Object.entries(perZoom)) {
        for (let i = 0; i + 1 < pairs.length; i += 2) {
          urls.push(
            `assets/map-tiles/${layer}/base/${z}/${pairs[i + 1]}/${pairs[i]}.webp`,
          );
        }
      }
    }
    return urls;
  }
}
