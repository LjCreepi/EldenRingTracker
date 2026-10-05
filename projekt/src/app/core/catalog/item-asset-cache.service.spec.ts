import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ItemCatalog } from '../models/item.model';
import { ItemAssetCacheService } from './item-asset-cache.service';
import { ItemCatalogService } from './item-catalog.service';

function catalogWith(icons: (string | undefined)[]): ItemCatalog {
  return {
    version: 'v1',
    attribution: '',
    categories: [{ id: 'talismans', name: 'Talismans' }],
    items: icons.map((icon, i) => ({
      id: `i${i}`,
      name: `Item ${i}`,
      category: 'talismans' as const,
      icon,
    })),
  };
}

describe('ItemAssetCacheService', () => {
  let cache: ItemAssetCacheService;
  let catalog: ItemCatalogService;
  let http: HttpTestingController;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    cache = TestBed.inject(ItemAssetCacheService);
    catalog = TestBed.inject(ItemCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as { onLine?: boolean }).onLine;
  });

  async function load(cat: ItemCatalog): Promise<void> {
    const p = catalog.load();
    http.expectOne(environment.itemCatalogUrl).flush(cat);
    await p;
  }

  it('does nothing until the catalog is loaded', () => {
    cache.ensure();
    expect(cache.state()).toBe('idle');
  });

  it('fetches each distinct icon once, then records the version', async () => {
    await load(catalogWith(['a.png', 'b.png', 'a.png', undefined]));
    cache.ensure();
    await vi.waitFor(() => expect(cache.state()).toBe('ready'));

    expect(fetchMock).toHaveBeenCalledTimes(2); // deduped, undefined skipped
    expect(localStorage.getItem('ert.itemAssetsCachedVersion')).toBe(
      JSON.stringify('v1'),
    );
  });

  it('skips the warm-up when the version is already cached', async () => {
    localStorage.setItem('ert.itemAssetsCachedVersion', JSON.stringify('v1'));
    await load(catalogWith(['a.png']));
    cache.ensure();
    expect(cache.state()).toBe('ready');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flags the first run only when nothing was cached before', async () => {
    await load(catalogWith(['a.png']));
    cache.ensure();
    expect(cache.firstRun()).toBe(true);
  });

  it('marks itself skipped without fetching when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    await load(catalogWith(['a.png']));
    cache.ensure();
    expect(cache.state()).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps downloading after dismiss and still records the version', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    fetchMock.mockImplementation(() =>
      gate.then(() => new Response('', { status: 200 })),
    );

    await load(catalogWith(Array.from({ length: 30 }, (_, i) => `icon-${i}.png`)));
    cache.ensure();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    cache.dismiss();
    expect(cache.state()).toBe('downloading');

    release();
    await vi.waitFor(() => expect(cache.state()).toBe('ready'));
    expect(fetchMock).toHaveBeenCalledTimes(30);
    expect(localStorage.getItem('ert.itemAssetsCachedVersion')).toBe(
      JSON.stringify('v1'),
    );
  });
});
