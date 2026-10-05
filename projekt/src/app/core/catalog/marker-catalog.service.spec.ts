import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MarkerCatalog } from '../models/marker.model';
import { MarkerCatalogService } from './marker-catalog.service';

const CATALOG: MarkerCatalog = {
  version: 'test',
  groups: [{ id: 'kit', name: 'Consumables & Kit', icon: 'g.png' }],
  categories: [
    { id: 'bosses', name: 'Bosses', icon: 'b.png', completable: true },
    { id: 'merchants', name: 'Merchants', icon: 'm.png', completable: false },
  ],
  markers: [
    { id: 'a', categoryId: 'bosses', layer: 'overworld', x: 1, y: 2, name: 'A' },
    { id: 'b', categoryId: 'bosses', layer: 'underground', x: 3, y: 4, name: 'B' },
  ],
};

describe('MarkerCatalogService', () => {
  let service: MarkerCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MarkerCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** The catalog load fetches the tile index in parallel; satisfy both. */
  function flushLoad(catalog = CATALOG): void {
    http.expectOne(environment.markerCatalogUrl).flush(catalog);
    http.expectOne(environment.tileIndexUrl).flush({ overworld: {} });
  }

  it('loads the catalog once and exposes its parts', async () => {
    const load = service.load();
    flushLoad();
    await load;

    expect(service.loaded()).toBe(true);
    expect(service.version()).toBe('test');
    expect(service.categories()).toHaveLength(2);
    expect(service.category('merchants')?.completable).toBe(false);
    expect(service.groups().map((g) => g.id)).toEqual(['kit']);
  });

  it('exposes no groups before the catalog loads', () => {
    expect(service.groups()).toEqual([]);
  });

  it('does not fetch again once loaded', async () => {
    const load = service.load();
    flushLoad();
    await load;

    await service.load();
    http.expectNone(environment.markerCatalogUrl);
  });

  it('filters markers by layer', async () => {
    const load = service.load();
    flushLoad();
    await load;

    expect(service.markersForLayer('overworld').map((m) => m.id)).toEqual(['a']);
  });
});
