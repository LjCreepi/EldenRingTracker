import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { ModalController } from '@ionic/angular';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

describe('AppComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    // A character + a completed onboarding, so the app shell renders (an empty
    // save would show the Onboarding Wizard instead).
    localStorage.setItem(
      'ert.characters',
      JSON.stringify([
        {
          id: 'c1',
          rawName: 'Tarnished',
          classId: 'vagabond',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    localStorage.setItem(
      'ert.onboardedVersion',
      JSON.stringify(environment.version),
    );
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideServiceWorker('ngsw-worker.js', { enabled: false }),
        // Injected by AppComponent; only exercised when the Characters modal is
        // opened, which these tests don't do — a bare stub is enough.
        { provide: ModalController, useValue: {} },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    // AppComponent kicks off the catalog load in its constructor.
    http.match(environment.markerCatalogUrl).forEach((req) =>
      req.flush({ version: 't', categories: [], markers: [] }),
    );
    http.match(environment.tileIndexUrl).forEach((req) => req.flush({}));
    http.match(environment.itemCatalogUrl).forEach((req) =>
      req.flush({ version: 't', categories: [], items: [] }),
    );
    return fixture;
  }

  const NAV = ['Map', 'Equipment', 'Inventory', 'Status', 'Settings', 'About'];
  const NAV_URLS = ['/map', '/equipment', '/inventory', '/status', '/settings', '/about'];

  it('creates the app', () => {
    expect(createComponent().componentInstance).toBeTruthy();
  });

  it('shows the navigation entries', async () => {
    const fixture = createComponent();
    await fixture.whenStable();
    const items = fixture.nativeElement.querySelectorAll(
      'ion-menu ion-list.nav-list ion-menu-toggle ion-item',
    );
    expect(
      [...items].map((el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual(NAV);
  });

  it('routes the navigation entries to the feature pages', () => {
    const fixture = createComponent();
    const router = TestBed.inject(Router);
    const targets = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((el) => el.injector.get(RouterLink))
      .map((link) => router.serializeUrl(link.urlTree!));
    expect(targets).toEqual(NAV_URLS);
  });
});
