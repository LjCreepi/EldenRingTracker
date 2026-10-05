import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MapLayerId } from '../models/map-layer.model';
import {
  Marker,
  MarkerCatalog,
  MarkerCategory,
  MarkerCategoryGroup,
  MarkerCategoryId,
} from '../models/marker.model';

/** `{ [layer]: { [z]: [x0, y0, x1, y1, ...] } }` — tiles present in the pyramid. */
export type TileIndex = Record<string, Record<string, number[]>>;

/**
 * Loads and holds the read-only Marker Catalog and the tile-existence index,
 * both static assets. See CONTEXT.md → "Marker Catalog".
 */
@Injectable({ providedIn: 'root' })
export class MarkerCatalogService {
  private readonly http = inject(HttpClient);

  private readonly catalog = signal<MarkerCatalog | null>(null);
  private readonly tileIndexState = signal<TileIndex | null>(null);

  readonly loaded = computed(() => this.catalog() !== null);
  readonly version = computed(() => this.catalog()?.version ?? null);
  readonly groups = computed<readonly MarkerCategoryGroup[]>(
    () => this.catalog()?.groups ?? [],
  );
  readonly categories = computed<readonly MarkerCategory[]>(
    () => this.catalog()?.categories ?? [],
  );
  readonly markers = computed<readonly Marker[]>(
    () => this.catalog()?.markers ?? [],
  );
  readonly tileIndex = this.tileIndexState.asReadonly();

  async load(): Promise<void> {
    if (this.catalog()) return;
    const [catalog, tileIndex] = await Promise.all([
      firstValueFrom(this.http.get<MarkerCatalog>(environment.markerCatalogUrl)),
      firstValueFrom(
        this.http.get<TileIndex>(environment.tileIndexUrl),
      ).catch(() => null),
    ]);
    this.tileIndexState.set(tileIndex);
    this.catalog.set(catalog);
  }

  category(id: MarkerCategoryId): MarkerCategory | undefined {
    return this.categories().find((c) => c.id === id);
  }

  markersForLayer(layer: MapLayerId): Marker[] {
    return this.markers().filter((m) => m.layer === layer);
  }
}
