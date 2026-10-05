import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ItemCatalog } from '../models/item.model';
import { ItemCatalogService } from './item-catalog.service';

const CATALOG: ItemCatalog = {
  version: 'itest',
  attribution: '',
  categories: [
    { id: 'consumables', name: 'Consumables' },
    { id: 'talismans', name: 'Talismans' },
    { id: 'melee-armaments', name: 'Melee Armaments' },
  ],
  items: [
    { id: 'boiled-crab', name: 'Boiled Crab', category: 'consumables' },
    { id: 'radagons-soreseal', name: "Radagon's Soreseal", category: 'talismans' },
    { id: 'longsword', name: 'Longsword', category: 'melee-armaments' },
  ],
};

describe('ItemCatalogService', () => {
  let service: ItemCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ItemCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function flush(catalog = CATALOG): Promise<void> {
    const load = service.load();
    http.expectOne(environment.itemCatalogUrl).flush(catalog);
    await load;
  }

  it('loads once and looks items up by id', async () => {
    await flush();
    expect(service.loaded()).toBe(true);
    expect(service.version()).toBe('itest');
    expect(service.item('longsword')?.name).toBe('Longsword');
  });

  it('lists only non-empty categories in Elden Ring tab order', async () => {
    await flush({
      ...CATALOG,
      items: [{ id: 'longsword', name: 'Longsword', category: 'melee-armaments' }],
    });
    expect(service.categories().map((c) => c.id)).toEqual(['melee-armaments']);
  });

  it('does not fetch again once loaded', async () => {
    await flush();
    await service.load();
    http.expectNone(environment.itemCatalogUrl);
  });
});
