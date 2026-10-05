import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import {
  AlertController,
  IonApp,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonModal,
  IonNote,
  IonRouterOutlet,
  IonSegment,
  IonSegmentButton,
  IonSplitPane,
  IonText,
  IonToggle,
  ModalController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bagHandle,
  body,
  chevronBack,
  chevronDown,
  chevronForward,
  informationCircle,
  informationCircleOutline,
  map,
  mapOutline,
  personCircle,
  settings,
  settingsOutline,
  shieldHalf,
} from 'ionicons/icons';

import { CharactersComponent } from './components/characters/characters.component';
import { OnboardingWizardComponent } from './components/onboarding-wizard/onboarding-wizard.component';
import { PreparingChipComponent } from './components/preparing-chip/preparing-chip.component';
import { WhatsNewComponent } from './components/whats-new/whats-new.component';
import { ItemAssetCacheService } from './core/catalog/item-asset-cache.service';
import { ItemCatalogService } from './core/catalog/item-catalog.service';
import { MapTileCacheService } from './core/catalog/map-tile-cache.service';
import { MarkerCatalogService } from './core/catalog/marker-catalog.service';
import { CharacterService } from './core/character/character.service';
import { CharacterSheetService } from './core/inventory/character-sheet.service';
import { startingClass } from './core/models/character-sheet.model';
import { DEFAULT_CLASS_ID } from './core/models/character.model';
import { MAP_LAYERS, MapLayerId } from './core/models/map-layer.model';
import { MarkerCategoryId } from './core/models/marker.model';
import { OnboardingService } from './core/onboarding/onboarding.service';
import { PreferencesService } from './core/preferences/preferences.service';
import { ProgressService } from './core/progress/progress.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonButton,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonNote,
    IonText,
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonRouterOutlet,
    IonModal,
    PreparingChipComponent,
    OnboardingWizardComponent,
    WhatsNewComponent,
  ],
})
export class AppComponent {
  protected readonly catalog = inject(MarkerCatalogService);
  protected readonly items = inject(ItemCatalogService);
  protected readonly itemAssets = inject(ItemAssetCacheService);
  protected readonly prefs = inject(PreferencesService);
  protected readonly progress = inject(ProgressService);
  protected readonly onboarding = inject(OnboardingService);
  protected readonly character = inject(CharacterService);
  private readonly sheet = inject(CharacterSheetService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  private readonly swUpdate = inject(SwUpdate);
  private readonly tileCache = inject(MapTileCacheService);

  /** Opens once a "What's New" note becomes relevant; closing marks it seen. */
  protected readonly showWhatsNew = signal(false);

  protected readonly activeClassName = computed(
    () =>
      startingClass(this.character.activeCharacter()?.classId ?? DEFAULT_CLASS_ID)
        .name,
  );
  protected readonly activeLevel = computed(() =>
    this.sheet.levelOf(this.character.activeCharacter()?.id ?? ''),
  );

  protected readonly navPages = [
    { title: 'Map', url: '/map', icon: 'map' },
    { title: 'Equipment', url: '/equipment', icon: 'shield-half' },
    { title: 'Inventory', url: '/inventory', icon: 'bag-handle' },
    { title: 'Status', url: '/status', icon: 'body' },
    { title: 'Settings', url: '/settings', icon: 'settings' },
    { title: 'About', url: '/about', icon: 'information-circle' },
  ];
  protected readonly layers = MAP_LAYERS;

  /** True when every marker category is currently shown on the map. */
  protected readonly allMarkersVisible = computed(() =>
    this.catalog
      .categories()
      .every((c) => this.prefs.isCategoryVisible(c.id, c.defaultHidden)),
  );

  /** Categories with no group — rendered as a flat list above the groups. */
  protected readonly ungroupedCategories = computed(() =>
    this.catalog.categories().filter((c) => !c.group),
  );
  /** Each group with its categories, in catalog order, empty groups dropped. */
  protected readonly groupedSections = computed(() => {
    const categories = this.catalog.categories();
    return this.catalog
      .groups()
      .map((group) => ({
        group,
        categories: categories.filter((c) => c.group === group.id),
      }))
      .filter((section) => section.categories.length > 0);
  });

  constructor() {
    inject(ThemeService); // activate: reflects preferences onto <html>
    addIcons({
      map,
      mapOutline,
      settings,
      settingsOutline,
      informationCircle,
      informationCircleOutline,
      chevronBack,
      chevronDown,
      chevronForward,
      shieldHalf,
      bagHandle,
      body,
      personCircle,
    });

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') void this.confirmReload();
    });

    // Surface the "What's New" note once it becomes relevant (after an update).
    effect(() => {
      if (this.onboarding.whatsNew()) this.showWhatsNew.set(true);
    });

    // Load the catalog, then warm the offline tile cache (once per data version).
    void this.catalog.load().then(() => this.tileCache.ensure());
    // The Item Catalog backs the Character menu. Load it, then warm every icon
    // into the cache once per catalog version — afterwards the Character screens
    // render straight from the cache and work offline (see ItemAssetCacheService).
    void this.items.load().then(() => this.itemAssets.ensure());


    // The app shell must not zoom like a document — only the Leaflet map zooms.
    // No single mechanism covers every browser, so guard each gesture, and let
    // anything inside `.leaflet-container` through so the map keeps its zoom:
    //  - double-tap zoom -> `touch-action: manipulation` (global.scss)
    //  - two-finger pinch, Android / Firefox -> `touchmove` with >1 touch
    //  - two-finger pinch, iOS Safari (ignores `user-scalable=no`) -> gestures
    //  - ctrl + wheel / trackpad pinch, desktop -> `wheel` with ctrlKey
    const overMap = (e: Event): boolean =>
      !!(e.target as HTMLElement | null)?.closest?.('.leaflet-container');

    document.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (e.touches.length > 1 && !overMap(e)) e.preventDefault();
      },
      { passive: false },
    );
    document.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (e.ctrlKey && !overMap(e)) e.preventDefault();
      },
      { passive: false },
    );
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      document.addEventListener(
        type,
        (e: Event) => {
          if (!overMap(e)) e.preventDefault();
        },
        { passive: false },
      );
    }
  }

  private async confirmReload(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Update available',
      message: 'A new version of the app is ready. Reload now?',
      buttons: [
        { text: 'Later', role: 'cancel' },
        { text: 'Reload', handler: () => window.location.reload() },
      ],
    });
    await alert.present();
  }

  protected setLayer(value: string | undefined): void {
    if (value) this.prefs.setActiveLayer(value as MapLayerId);
  }

  protected async openCharacters(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: CharactersComponent });
    await modal.present();
  }

  protected onWhatsNewDismissed(): void {
    this.showWhatsNew.set(false);
    this.onboarding.markDone();
  }

  protected count(categoryId: MarkerCategoryId): { done: number; total: number } {
    const markers = this.catalog
      .markers()
      .filter((m) => m.categoryId === categoryId);
    return { done: this.progress.completedCount(markers), total: markers.length };
  }
}
