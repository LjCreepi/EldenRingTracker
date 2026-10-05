import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MapTileCacheService } from './map-tile-cache.service';
import { MarkerCatalogService } from './marker-catalog.service';

const CATALOG = { version: 'v1', categories: [], markers: [] };
const TILE_INDEX = { overworld: { '0': [0, 0], '1': [0, 0, 1, 0] } };

/** A tile index with `count` tiles at zoom 0, for exercising the worker pool. */
function bigIndex(count: number): Record<string, Record<string, number[]>> {
  const pairs: number[] = [];
  for (let x = 0; x < count; x++) pairs.push(x, 0);
  return { overworld: { '0': pairs } };
}

describe('MapTileCacheService', () => {
  let cache: MapTileCacheService;
  let catalog: MarkerCatalogService;
  let http: HttpTestingController;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    cache = TestBed.inject(MapTileCacheService);
    catalog = TestBed.inject(MarkerCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as { onLine?: boolean }).onLine;
  });

  function goOffline(): void {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
  }

  async function loadCatalog(tileIndex: object = TILE_INDEX): Promise<void> {
    const p = catalog.load();
    http.expectOne(environment.markerCatalogUrl).flush(CATALOG);
    http.expectOne(environment.tileIndexUrl).flush(tileIndex);
    await p;
  }

  it('does nothing until the catalog is loaded', () => {
    cache.ensure();
    expect(cache.state()).toBe('idle');
  });

  it('fetches every tile in the index once, then marks the version done', async () => {
    await loadCatalog();
    cache.ensure();
    await vi.waitFor(() => expect(cache.state()).toBe('ready'));

    // 3 tiles: (0,0)@z0, (0,0) and (1,0)@z1
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'assets/map-tiles/overworld/base/1/0/1.webp',
    );
    expect(localStorage.getItem('ert.tilesCachedVersion')).toBe(
      JSON.stringify('v1'),
    );
  });

  it('skips the download when the version is already cached', async () => {
    localStorage.setItem('ert.tilesCachedVersion', JSON.stringify('v1'));
    await loadCatalog();
    cache.ensure();
    expect(cache.state()).toBe('ready');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-downloads when the cached version is stale', async () => {
    localStorage.setItem('ert.tilesCachedVersion', JSON.stringify('v0'));
    await loadCatalog(); // catalog is 'v1'
    cache.ensure();
    await vi.waitFor(() => expect(cache.state()).toBe('ready'));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem('ert.tilesCachedVersion')).toBe(
      JSON.stringify('v1'),
    );
  });

  it('flags the first run only when nothing was cached before', async () => {
    await loadCatalog();
    cache.ensure();
    expect(cache.firstRun()).toBe(true);
  });

  it('does not flag a stale-version refresh as the first run', async () => {
    localStorage.setItem('ert.tilesCachedVersion', JSON.stringify('v0'));
    await loadCatalog();
    cache.ensure();
    expect(cache.firstRun()).toBe(false);
  });

  it('marks itself skipped without fetching when offline', async () => {
    goOffline();
    await loadCatalog();
    cache.ensure();
    expect(cache.state()).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps downloading after dismiss and still persists the version', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    fetchMock.mockImplementation(() =>
      gate.then(() => new Response('', { status: 200 })),
    );

    await loadCatalog(bigIndex(50));
    cache.ensure();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(cache.state()).toBe('downloading');

    cache.dismiss();
    expect(cache.dismissed()).toBe(true);
    expect(cache.state()).toBe('downloading'); // UI steps back, work continues

    release();
    await vi.waitFor(() => expect(cache.state()).toBe('ready'));
    // Every tile still fetched, version recorded — offline-ready despite dismiss.
    expect(fetchMock).toHaveBeenCalledTimes(50);
    expect(localStorage.getItem('ert.tilesCachedVersion')).toBe(
      JSON.stringify('v1'),
    );
  });
});
