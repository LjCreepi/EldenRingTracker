import { Injectable, effect, inject } from '@angular/core';
import { PreferencesService } from '../preferences/preferences.service';
import { ThemeMode, ThemeScheme } from '../models/preferences.model';

/**
 * Reflects the user's colour scheme + light/dark choice onto the document:
 * - `data-scheme="erdtree|ash"` selects the palette (see src/theme/variables.scss)
 * - `.ion-palette-dark` on <html> switches Ionic into dark mode
 * - `<meta name="theme-color">` is repointed at the effective body background so
 *   the browser chrome / PWA status bar tracks the scheme (the manifest's own
 *   `theme_color` is static and can't).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly prefs = inject(PreferencesService);
  private readonly darkQuery =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  constructor() {
    effect(() => this.apply(this.prefs.scheme(), this.prefs.mode()));
    this.darkQuery?.addEventListener('change', () =>
      this.apply(this.prefs.scheme(), this.prefs.mode()),
    );
  }

  /** True when the effective appearance is dark, given mode + OS setting. */
  isDark(mode: ThemeMode = this.prefs.mode()): boolean {
    return mode === 'dark' || (mode === 'system' && !!this.darkQuery?.matches);
  }

  private apply(scheme: ThemeScheme, mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-scheme', scheme);
    root.classList.toggle('ion-palette-dark', this.isDark(mode));
    this.syncThemeColorMeta();
  }

  /** Point `<meta name="theme-color">` at the rendered body background. */
  private syncThemeColorMeta(): void {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta || !document.body) return;
    const bg = getComputedStyle(document.body).backgroundColor;
    // jsdom / very early boot returns '' — leave the static fallback in place.
    if (bg) meta.setAttribute('content', bg);
  }
}
