import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { MapLayerId } from '../models/map-layer.model';
import { MarkerCategory, MarkerCategoryId } from '../models/marker.model';
import {
  DEFAULT_PREFERENCES,
  Preferences,
  ThemeMode,
  ThemeScheme,
} from '../models/preferences.model';
import { StorageService } from '../storage/storage.service';

const STORAGE_KEY = 'preferences';

/**
 * Holds the user's view preferences as a signal and persists every change.
 * See CONTEXT.md → "Category Visibility".
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly storage = inject(StorageService);

  private readonly state = signal<Preferences>(this.load());

  readonly preferences = this.state.asReadonly();
  readonly scheme = computed(() => this.state().scheme);
  readonly mode = computed(() => this.state().mode);
  readonly activeLayer = computed(() => this.state().activeLayer);
  readonly hiddenCategories = computed(() => this.state().hiddenCategories);
  readonly shownCategories = computed(() => this.state().shownCategories);
  readonly collapsedGroups = computed(() => this.state().collapsedGroups);
  readonly clusterMarkers = computed(() => this.state().clusterMarkers);
  readonly menuDocked = computed(() => this.state().menuDocked);

  constructor() {
    effect(() => this.storage.write(STORAGE_KEY, this.state()));
  }

  /**
   * Whether a category's markers are drawn. A `defaultHidden` category is off
   * unless explicitly switched on; every other category is on unless explicitly
   * switched off.
   */
  isCategoryVisible(id: MarkerCategoryId, defaultHidden = false): boolean {
    const { hiddenCategories, shownCategories } = this.state();
    if (hiddenCategories.includes(id)) return false;
    if (defaultHidden) return shownCategories.includes(id);
    return true;
  }

  /** The ids of every currently-hidden category, resolving `defaultHidden`. */
  hiddenCategoryIds(categories: readonly MarkerCategory[]): MarkerCategoryId[] {
    return categories
      .filter((c) => !this.isCategoryVisible(c.id, c.defaultHidden))
      .map((c) => c.id);
  }

  /** Show or hide every marker category at once. */
  setAllCategoriesVisible(
    categories: readonly MarkerCategory[],
    visible: boolean,
  ): void {
    this.patch(
      visible
        ? {
            hiddenCategories: [],
            shownCategories: categories
              .filter((c) => c.defaultHidden)
              .map((c) => c.id),
          }
        : { hiddenCategories: categories.map((c) => c.id), shownCategories: [] },
    );
  }

  setScheme(scheme: ThemeScheme): void {
    this.patch({ scheme });
  }

  setMode(mode: ThemeMode): void {
    this.patch({ mode });
  }

  setActiveLayer(activeLayer: MapLayerId): void {
    this.patch({ activeLayer });
  }

  setClusterMarkers(clusterMarkers: boolean): void {
    this.patch({ clusterMarkers });
  }

  setMenuDocked(menuDocked: boolean): void {
    this.patch({ menuDocked });
  }

  toggleMenuDocked(): void {
    this.patch({ menuDocked: !this.state().menuDocked });
  }

  isGroupCollapsed(id: string): boolean {
    return this.state().collapsedGroups.includes(id);
  }

  toggleGroupCollapsed(id: string): void {
    const collapsed = new Set(this.state().collapsedGroups);
    collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id);
    this.patch({ collapsedGroups: [...collapsed] });
  }

  toggleCategory(id: MarkerCategoryId, defaultHidden = false): void {
    this.setCategoryVisible(id, !this.isCategoryVisible(id, defaultHidden), defaultHidden);
  }

  setCategoryVisible(
    id: MarkerCategoryId,
    visible: boolean,
    defaultHidden = false,
  ): void {
    const hidden = new Set(this.state().hiddenCategories);
    const shown = new Set(this.state().shownCategories);
    if (visible) {
      hidden.delete(id);
      if (defaultHidden) shown.add(id);
    } else {
      hidden.add(id);
      shown.delete(id);
    }
    this.patch({ hiddenCategories: [...hidden], shownCategories: [...shown] });
  }

  private patch(change: Partial<Preferences>): void {
    this.state.update((current) => ({ ...current, ...change }));
  }

  private load(): Preferences {
    const stored = this.storage.read<Partial<Preferences>>(STORAGE_KEY, {});
    return { ...DEFAULT_PREFERENCES, ...stored };
  }
}
