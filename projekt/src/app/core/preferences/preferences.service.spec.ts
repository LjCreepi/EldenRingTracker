import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_PREFERENCES } from '../models/preferences.model';
import { PreferencesService } from './preferences.service';

function flushEffects(): void {
  TestBed.inject(ApplicationRef).tick();
}

describe('PreferencesService', () => {
  let service: PreferencesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreferencesService);
  });

  it('starts from the defaults', () => {
    expect(service.preferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('toggles a category off and back on', () => {
    service.toggleCategory('bosses');
    expect(service.isCategoryVisible('bosses')).toBe(false);
    expect(service.hiddenCategories()).toEqual(['bosses']);

    service.toggleCategory('bosses');
    expect(service.isCategoryVisible('bosses')).toBe(true);
    expect(service.hiddenCategories()).toEqual([]);
  });

  it('setCategoryVisible is idempotent', () => {
    service.setCategoryVisible('merchants', false);
    service.setCategoryVisible('merchants', false);
    expect(service.hiddenCategories()).toEqual(['merchants']);
  });

  it('a defaultHidden category is off until switched on', () => {
    expect(service.isCategoryVisible('cookbooks', true)).toBe(false);

    service.setCategoryVisible('cookbooks', true, true);
    expect(service.isCategoryVisible('cookbooks', true)).toBe(true);
    expect(service.shownCategories()).toEqual(['cookbooks']);

    service.setCategoryVisible('cookbooks', false, true);
    expect(service.isCategoryVisible('cookbooks', true)).toBe(false);
    expect(service.shownCategories()).toEqual([]);
  });

  it('hiddenCategoryIds resolves defaultHidden against explicit choices', () => {
    service.setCategoryVisible('bosses', false);
    service.setCategoryVisible('golden-seeds', true, true);
    const categories = [
      { id: 'bosses', name: '', icon: '', completable: true },
      { id: 'dungeons', name: '', icon: '', completable: true },
      { id: 'golden-seeds', name: '', icon: '', completable: true, defaultHidden: true },
      { id: 'cookbooks', name: '', icon: '', completable: true, defaultHidden: true },
    ];
    expect(service.hiddenCategoryIds(categories).sort()).toEqual(
      ['bosses', 'cookbooks'].sort(),
    );
  });

  it('shows or hides every category at once', () => {
    const categories = [
      { id: 'bosses', name: '', icon: '', completable: true },
      { id: 'golden-seeds', name: '', icon: '', completable: true, defaultHidden: true },
      { id: 'cookbooks', name: '', icon: '', completable: true, defaultHidden: true },
    ];

    service.setAllCategoriesVisible(categories, true);
    expect(service.hiddenCategoryIds(categories)).toEqual([]);

    service.setAllCategoriesVisible(categories, false);
    expect(service.hiddenCategoryIds(categories).sort()).toEqual(
      ['bosses', 'cookbooks', 'golden-seeds'].sort(),
    );
  });

  it('collapses and expands a category group', () => {
    expect(service.isGroupCollapsed('upgrades')).toBe(false);

    service.toggleGroupCollapsed('upgrades');
    expect(service.isGroupCollapsed('upgrades')).toBe(true);
    expect(service.collapsedGroups()).toEqual(['upgrades']);

    service.toggleGroupCollapsed('upgrades');
    expect(service.isGroupCollapsed('upgrades')).toBe(false);
    expect(service.collapsedGroups()).toEqual([]);
  });

  it('clustering defaults on and can be switched off', () => {
    expect(service.clusterMarkers()).toBe(true);
    service.setClusterMarkers(false);
    expect(service.clusterMarkers()).toBe(false);
  });

  it('menu docks by default and can be collapsed', () => {
    expect(service.menuDocked()).toBe(true);
    service.toggleMenuDocked();
    expect(service.menuDocked()).toBe(false);
    service.setMenuDocked(true);
    expect(service.menuDocked()).toBe(true);
  });

  it('persists changes and reloads them into a fresh instance', () => {
    service.setScheme('ash');
    service.setActiveLayer('underground');
    flushEffects();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(PreferencesService);
    expect(reloaded.scheme()).toBe('ash');
    expect(reloaded.activeLayer()).toBe('underground');
  });

  it('merges stored preferences over defaults (forward compatible)', () => {
    localStorage.setItem('ert.preferences', JSON.stringify({ scheme: 'ash' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(PreferencesService);
    expect(reloaded.scheme()).toBe('ash');
    expect(reloaded.mode()).toBe(DEFAULT_PREFERENCES.mode);
  });
});
