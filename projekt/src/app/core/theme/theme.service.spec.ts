import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesService } from '../preferences/preferences.service';
import { ThemeService } from './theme.service';

function tick(): void {
  TestBed.inject(ApplicationRef).tick();
}

describe('ThemeService', () => {
  let prefs: PreferencesService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.classList.remove('ion-palette-dark');
    TestBed.configureTestingModule({});
    prefs = TestBed.inject(PreferencesService);
    TestBed.inject(ThemeService);
    tick();
  });

  it('reflects the active scheme onto <html>', () => {
    expect(document.documentElement.getAttribute('data-scheme')).toBe('erdtree');
    prefs.setScheme('ash');
    tick();
    expect(document.documentElement.getAttribute('data-scheme')).toBe('ash');
  });

  it('adds the dark palette class when the mode is dark', () => {
    prefs.setMode('dark');
    tick();
    expect(
      document.documentElement.classList.contains('ion-palette-dark'),
    ).toBe(true);
  });

  it('removes the dark palette class when switching back to light', () => {
    prefs.setMode('dark');
    tick();
    prefs.setMode('light');
    tick();
    expect(
      document.documentElement.classList.contains('ion-palette-dark'),
    ).toBe(false);
  });

  it('isDark follows the explicit mode', () => {
    expect(TestBed.inject(ThemeService).isDark('dark')).toBe(true);
    expect(TestBed.inject(ThemeService).isDark('light')).toBe(false);
  });

  it('repoints <meta name="theme-color"> at the body background on change', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#000000';
    document.head.appendChild(meta);
    document.body.style.backgroundColor = 'rgb(18, 18, 18)';
    try {
      prefs.setScheme('ash');
      tick();
      expect(meta.content).toBe('rgb(18, 18, 18)');
    } finally {
      meta.remove();
      document.body.style.backgroundColor = '';
    }
  });
});
