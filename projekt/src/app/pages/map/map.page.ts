import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
  PopoverController,
  ViewDidEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { L } from '../../core/map/leaflet';

import {
  MarkerCatalogService,
  TileIndex,
} from '../../core/catalog/marker-catalog.service';
import { MapTileCacheService } from '../../core/catalog/map-tile-cache.service';
import { ItemAssetCacheService } from '../../core/catalog/item-asset-cache.service';
import { CharacterService } from '../../core/character/character.service';
import { PreparingChipComponent } from '../../components/preparing-chip/preparing-chip.component';
import {
  MAP_LAYERS,
  MapLayer,
  MapLayerId,
  NATIVE_ZOOM,
  TILE_SIZE,
  MASTER_SIZE,
  mapLayer,
} from '../../core/models/map-layer.model';
import { Marker, MarkerCategory } from '../../core/models/marker.model';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { ProgressService } from '../../core/progress/progress.service';
import { visibleMarkers } from '../../features/map/marker-visibility';
import { MarkerDetailComponent } from '../../components/marker-detail/marker-detail.component';
import { MenuDockButtonComponent } from '../../components/menu-dock-button/menu-dock-button.component';

const MAP_ATTRIBUTION =
  'Imagery &copy; FromSoftware / Bandai Namco via elden-ring-compass &mdash; unofficial fan project, educational use';

/** A `TileLayer` that never requests a tile the pyramid doesn't contain. */
function makeTileLayer(
  url: string,
  bounds: L.LatLngBounds,
  exists: (z: number, x: number, y: number) => boolean,
): L.TileLayer {
  const Cls = L.TileLayer.extend({
    _isValidTile(coords: L.Coords): boolean {
      const grid = L.GridLayer.prototype as unknown as {
        _isValidTile(c: L.Coords): boolean;
      };
      return (
        grid._isValidTile.call(this, coords) &&
        exists(coords.z, coords.x, coords.y)
      );
    },
  }) as unknown as new (u: string, o: L.TileLayerOptions) => L.TileLayer;
  return new Cls(url, {
    tileSize: TILE_SIZE,
    minNativeZoom: 0,
    maxNativeZoom: NATIVE_ZOOM,
    noWrap: true,
    bounds,
    attribution: MAP_ATTRIBUTION,
  });
}

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    MenuDockButtonComponent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonText,
    IonTitle,
    IonContent,
    IonCard,
    IonItem,
    IonButton,
    IonIcon,
    PreparingChipComponent,
    MarkerDetailComponent,
  ],
})
export class MapPage implements ViewDidEnter {
  protected readonly catalog = inject(MarkerCatalogService);
  protected readonly prefs = inject(PreferencesService);
  protected readonly progress = inject(ProgressService);
  protected readonly character = inject(CharacterService);
  private readonly popoverCtrl = inject(PopoverController);
  protected readonly tileCache = inject(MapTileCacheService);
  private readonly itemAssets = inject(ItemAssetCacheService);

  /** The app-shell "Saving item art" chip is also fixed to this corner — stack
   *  above it rather than overlap when both warm-ups are running at once. */
  protected readonly tileChipStackIndex = computed(() =>
    this.itemAssets.state() === 'downloading' && !this.itemAssets.dismissed()
      ? 1
      : 0,
  );

  /** Surface / Underground switch — lives in the toolbar on tablet+/desktop
   *  (docs/responsive.md); phones keep it in the side menu (AppComponent). */
  protected readonly layers = MAP_LAYERS;

  /**
   * Docked marker-detail panel (tablet+/desktop only — see `openMarker`); phones
   * get the floating popover instead. `null` when nothing is selected.
   */
  protected readonly selectedMarker = signal<{
    marker: Marker;
    category: MarkerCategory;
  } | null>(null);

  /** Overall completion across every completable category — wide screens only. */
  protected readonly overallProgress = computed(() => {
    const completable = new Set(
      this.catalog
        .categories()
        .filter((c) => c.completable)
        .map((c) => c.id),
    );
    const markers = this.catalog
      .markers()
      .filter((m) => completable.has(m.categoryId));
    return { done: this.progress.completedCount(markers), total: markers.length };
  });

  private readonly host =
    viewChild.required<ElementRef<HTMLDivElement>>('mapHost');

  private map?: L.Map;
  private bounds?: L.LatLngBounds;
  private tileLayer?: L.TileLayer;
  /** One layer per marker category (a cluster group, or a plain group when
   *  clustering is off), so clusters only ever group like with like. */
  private readonly categoryLayers = new Map<string, L.LayerGroup>();
  private renderedLayerId?: MapLayerId;
  /** Set once the user pans/zooms, so resizes stop re-framing under them. */
  private userMovedMap = false;
  /** True while `frame()` moves the map, so its own events aren't "user" moves. */
  private framing = false;

  constructor() {
    addIcons({ close });
    afterNextRender(() => this.initMap());
    effect(() => this.syncFromState());
    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  ionViewDidEnter(): void {
    this.map?.invalidateSize({ animate: false });
    if (!this.userMovedMap) this.frame();
  }

  private initMap(): void {
    const host = this.host().nativeElement;
    const map = L.map(host, {
      crs: L.CRS.Simple,
      zoomSnap: 0,
      zoomDelta: 0.5,
      maxBoundsViscosity: 1,
    });
    map.attributionControl.setPrefix(false);
    this.map = map;
    this.bounds = L.latLngBounds(
      map.unproject([0, MASTER_SIZE], NATIVE_ZOOM),
      map.unproject([MASTER_SIZE, 0], NATIVE_ZOOM),
    );
    map.setMaxBounds(this.bounds);

    map.on('dragstart zoomstart', () => {
      if (!this.framing) this.userMovedMap = true;
    });

    new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      if (!this.userMovedMap) this.frame();
    }).observe(host);

    this.applyLayer(mapLayer(this.prefs.activeLayer()));
    this.frame();
    this.renderMarkers();
  }

  /** Re-runs whenever layer / visibility / completion / catalog change. */
  private syncFromState(): void {
    const layer = mapLayer(this.prefs.activeLayer());
    this.prefs.hiddenCategories();
    this.prefs.shownCategories();
    this.prefs.clusterMarkers();
    this.progress.completed();
    this.catalog.markers();
    this.catalog.tileIndex();

    if (!this.map) return;
    if (this.renderedLayerId !== layer.id) {
      this.applyLayer(layer);
      this.userMovedMap = false;
      this.frame();
    }
    this.renderMarkers();
  }

  private applyLayer(layer: MapLayer): void {
    if (!this.map || !this.bounds) return;
    const index = this.catalog.tileIndex();
    this.tileLayer?.remove();
    this.tileLayer = makeTileLayer(
      layer.tileUrl,
      this.bounds,
      tileExists(index, layer.id),
    ).addTo(this.map);
    this.renderedLayerId = layer.id;
  }

  /**
   * Centre the map and size the zoom range to the container: the opening view
   * fills it (no letterbox bars), and you can zoom out until the whole map just
   * fits, but no further.
   */
  private frame(): void {
    if (!this.map || !this.bounds) return;
    this.framing = true;
    this.map.setMinZoom(-10);
    const containZoom = this.map.getBoundsZoom(this.bounds, false);
    this.map.setMinZoom(containZoom);
    this.map.setMaxZoom(NATIVE_ZOOM + 1);
    // Open a little tighter than "whole map fits" so the view fills the frame
    // and regions are legible; the user can still zoom out to `containZoom`.
    this.map.setView(this.bounds.getCenter(), containZoom + 1, { animate: false });
    this.framing = false;
  }

  private renderMarkers(): void {
    if (!this.map) return;
    const map = this.map;
    const layer = mapLayer(this.prefs.activeLayer());
    const done = this.progress.completed();
    const clustering = this.prefs.clusterMarkers();

    const byCategory = groupByCategory(
      visibleMarkers(
        this.catalog.markers(),
        layer.id,
        this.prefs.hiddenCategoryIds(this.catalog.categories()),
      ),
    );

    this.pruneStaleCategoryLayers(byCategory);

    for (const [categoryId, markers] of byCategory) {
      const category = this.catalog.category(categoryId);
      if (!category) continue;

      // Rebuilt each render: cheap at this scale, and a clustering toggle or a
      // completion change may have changed how these markers should look.
      this.categoryLayers.get(categoryId)?.remove();
      const group = this.buildCategoryGroup(map, category, markers, done, clustering);
      group.addTo(map);
      this.categoryLayers.set(categoryId, group);
    }
  }

  /** Removes layers for categories no longer among `activeCategories`. */
  private pruneStaleCategoryLayers(activeCategories: ReadonlyMap<string, unknown>): void {
    for (const [id, group] of this.categoryLayers) {
      if (!activeCategories.has(id)) {
        group.remove();
        this.categoryLayers.delete(id);
      }
    }
  }

  /** Every Leaflet marker for one category, clustered or plain per `clustering`. */
  private buildCategoryGroup(
    map: L.Map,
    category: MarkerCategory,
    markers: readonly Marker[],
    done: ReadonlySet<string>,
    clustering: boolean,
  ): L.LayerGroup {
    const group = clustering ? clusterGroup(category) : L.layerGroup();
    for (const marker of markers) {
      this.addMarkerLayer(map, category, marker, done, group);
    }
    return group;
  }

  private addMarkerLayer(
    map: L.Map,
    category: MarkerCategory,
    marker: Marker,
    done: ReadonlySet<string>,
    group: L.LayerGroup,
  ): void {
    const complete = category.completable && done.has(marker.id);
    // A completed marker whose optional bonus step is still open (e.g. a
    // found merchant without its Bell Bearing) carries a small flag badge.
    const bonusPending =
      complete &&
      !!category.bonusStep &&
      !done.has(`${marker.id}#${category.bonusStep.id}`);
    // Screen-reader label for a pending bonus step — sighted users get the
    // flag badge (see pinIcon); this is the only cue for everyone else.
    const label = bonusPending
      ? `${marker.name} — ${category.bonusStep!.action} still available`
      : marker.name;
    L.marker(map.unproject([marker.x, marker.y], NATIVE_ZOOM), {
      icon: pinIcon(category.icon, complete, bonusPending),
    })
      .bindTooltip(marker.name, { direction: 'top', offset: [0, -14] })
      .on('click', (event) => this.openMarker(marker, event.originalEvent))
      // Leaflet renders the pin as role="button" with no accessible name;
      // name it once the icon element exists (re-runs whenever Leaflet
      // recreates the icon, e.g. on decluster).
      .on('add', (event) =>
        (event.target as L.Marker).getElement()?.setAttribute('aria-label', label),
      )
      .addTo(group);
  }

  protected setLayer(value: string | undefined): void {
    if (value) this.prefs.setActiveLayer(value as MapLayerId);
  }

  protected closeDetail(): void {
    this.selectedMarker.set(null);
  }

  /**
   * Phones get a floating popover anchored to the tap; tablet+/desktop (see
   * docs/responsive.md) get a docked side panel instead (rendered in the
   * template from `selectedMarker`) — a fixed panel never needs to resize
   * itself around changing content, which is what made the popover feel odd
   * when toggling completion (see MarkerDetailComponent).
   */
  private async openMarker(marker: Marker, event: MouseEvent): Promise<void> {
    const category = this.catalog.category(marker.categoryId);
    if (!category) return;

    if (window.matchMedia('(min-width: 768px)').matches) {
      this.selectedMarker.set({ marker, category });
      return;
    }
    const popover = await this.popoverCtrl.create({
      component: MarkerDetailComponent,
      componentProps: { marker, category },
      event,
      reference: 'event',
      side: 'top',
      alignment: 'center',
    });
    await popover.present();
  }
}

function groupByCategory(markers: readonly Marker[]): Map<string, Marker[]> {
  const byCategory = new Map<string, Marker[]>();
  for (const marker of markers) {
    const list = byCategory.get(marker.categoryId);
    if (list) list.push(marker);
    else byCategory.set(marker.categoryId, [marker]);
  }
  return byCategory;
}

/**
 * The pin for a single marker: the category icon, dimmed once complete, with a
 * small flag badge when a completed marker still has an open bonus step.
 */
function pinIcon(
  iconUrl: string,
  complete: boolean,
  bonusPending = false,
): L.DivIcon {
  return L.divIcon({
    className: 'erm-pin-wrap',
    html:
      `<span class="erm-pin${complete ? ' erm-pin--done' : ''}">` +
      `<img src="${iconUrl}" alt="" draggable="false" />` +
      // An inline SVG rather than <ion-icon>: this markup is handed to Leaflet
      // as a raw HTML string, not rendered through Angular, so it needs no
      // icon registration to always draw correctly. See docs — About page
      // explains what this badge means (CONTEXT.md → "Bonus Step").
      (bonusPending
        ? '<i class="erm-pin__flag">' +
          '<svg viewBox="0 0 24 24" width="7" height="7">' +
          '<path d="M5 2v20M5 3h14l-3.5 4.5L19 12H5" fill="none" ' +
          'stroke="#3a2a06" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
          '</i>'
        : '') +
      `</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

/**
 * A cluster group for one category: its clusters show that category's icon with
 * the child count on top. Because there is one group per category, a cluster
 * never mixes types — where several types overlap you get one bubble each,
 * side by side.
 */
function clusterGroup(category: MarkerCategory): L.MarkerClusterGroup {
  return L.markerClusterGroup({
    chunkedLoading: true,
    showCoverageOnHover: false,
    maxClusterRadius: 40,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: (cluster) =>
      L.divIcon({
        className: 'erm-cluster-wrap',
        html:
          `<span class="erm-cluster">` +
          `<img src="${category.icon}" alt="" draggable="false" />` +
          `<b class="erm-cluster__count">${cluster.getChildCount()}</b>` +
          `</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
  });
}

/** A `{x,y}` pair list, packed two-per-entry, as a `(x << 16) | y` lookup set. */
function packedTileSet(pairs: readonly number[]): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    set.add((pairs[i] << 16) | pairs[i + 1]); // (x << 16) | y
  }
  return set;
}

/** Builds a fast `(z,x,y) => boolean` from the packed tile index for one layer. */
function tileExists(
  index: TileIndex | null,
  layer: MapLayerId,
): (z: number, x: number, y: number) => boolean {
  const perZoom = index?.[layer];
  if (!perZoom) return () => true;
  const sets = new Map(
    Object.entries(perZoom).map(([z, pairs]) => [Number(z), packedTileSet(pairs)]),
  );
  return (z, x, y) => sets.get(z)?.has((x << 16) | y) ?? false;
}
