import { Injectable } from '@angular/core';

/**
 * Thin, synchronous key/value persistence over `localStorage`.
 *
 * Everything the app stores locally goes through here so the mechanism can be
 * swapped later (IndexedDB, a backend) without touching callers.
 * See docs/adr/0001-local-only-no-backend.md.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'ert.';

  /** Returns the stored value for `key`, or `fallback` if absent/unreadable. */
  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** Persists `value` under `key`. Failures (private mode, quota) are swallowed. */
  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      /* best effort */
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* best effort */
    }
  }
}
