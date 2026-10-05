import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../storage/storage.service';

const CONCURRENCY = 16;

export type CacheState = 'idle' | 'downloading' | 'ready' | 'skipped';

/**
 * Shared warm-up-cache state machine, extracted from {@link ItemAssetCacheService}
 * and {@link MapTileCacheService}: fetches every URL a subclass names (which the
 * Angular service worker's `lazy` groups then store) once per catalog version,
 * tracking progress for a blocking-screen-then-corner-chip UI.
 *
 * `firstRun` marks the very first warm-up (nothing cached — worth a visible
 * chip); `dismiss()` only hides the UI — the download always runs to
 * completion so the cache ends up whole.
 */
@Injectable()
export abstract class WarmupCacheService {
  private readonly storage = inject(StorageService);

  /** localStorage key the last-warmed catalog version is recorded under. */
  protected abstract readonly storageKey: string;
  /** The catalog version to warm for, or `null`/`undefined` while still loading. */
  protected abstract catalogVersion(): string | null | undefined;
  /** Every URL to fetch for this warm-up. */
  protected abstract urls(): string[];

  private readonly stateSignal = signal<CacheState>('idle');
  readonly state = this.stateSignal.asReadonly();

  private readonly firstRunSignal = signal(false);
  readonly firstRun = this.firstRunSignal.asReadonly();

  private readonly dismissedSignal = signal(false);
  readonly dismissed = this.dismissedSignal.asReadonly();

  readonly progress = signal<{ loaded: number; total: number }>({
    loaded: 0,
    total: 0,
  });
  readonly ratio = computed(() => {
    const { loaded, total } = this.progress();
    return total > 0 ? loaded / total : 0;
  });

  /** Starts the warm-up unless it's already done for this catalog version. */
  ensure(): void {
    if (this.stateSignal() !== 'idle') return;
    const version = this.catalogVersion();
    if (!version) return; // catalog not loaded yet — caller retries

    const cached = this.storage.read<string | null>(this.storageKey, null);
    if (cached === version) {
      this.stateSignal.set('ready');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.stateSignal.set('skipped');
      return;
    }
    this.firstRunSignal.set(cached === null);
    this.stateSignal.set('downloading');
    void this.download(version);
  }

  /** Hide the chip. The download keeps running to completion. Not persisted. */
  dismiss(): void {
    this.dismissedSignal.set(true);
  }

  private async download(version: string): Promise<void> {
    const urls = this.urls();
    this.progress.set({ loaded: 0, total: urls.length });

    let loaded = 0;
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < urls.length) {
        const url = urls[cursor++];
        try {
          await fetch(url);
        } catch {
          /* a missed asset just means a slower first use / placeholder */
        }
        loaded++;
        this.progress.set({ loaded, total: urls.length });
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    this.storage.write(this.storageKey, version);
    this.stateSignal.set('ready');
  }
}
