import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PopoverController } from '@ionic/angular';

import { Marker, MarkerCategory } from '../../core/models/marker.model';
import { MarkerDetailComponent } from './marker-detail.component';

const CATEGORY: MarkerCategory = {
  id: 'sites-of-grace',
  name: 'Sites of Grace',
  icon: 'i.png',
  completable: true,
  completion: { action: 'Mark grace as discovered', doneStatus: 'Lost grace discovered' },
};
const MARKER: Marker = {
  id: 'grace-1',
  categoryId: 'sites-of-grace',
  layer: 'overworld',
  x: 0,
  y: 0,
  name: 'The First Step',
};

describe('MarkerDetailComponent', () => {
  let component: MarkerDetailComponent;
  let fixture: ComponentFixture<MarkerDetailComponent>;

  beforeEach(() => {
    localStorage.clear();
    // The real app gets a working PopoverController from `provideIonicAngular()`
    // in main.ts; that pulls in AngularDelegate + friends, which is more than
    // this unit test needs — a bare fake covers the dismiss() call.
    TestBed.configureTestingModule({
      providers: [{ provide: PopoverController, useValue: { dismiss: () => Promise.resolve(true) } }],
    });
    fixture = TestBed.createComponent(MarkerDetailComponent);
    component = fixture.componentInstance;
    component.marker = MARKER;
    component.category = CATEGORY;
    // Isolated from a real popover; toggling shouldn't try to dismiss one.
    component.dismissOnToggle = false;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('shows the category-specific action label while incomplete', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mark grace as discovered');
    expect(text).not.toContain('Lost grace discovered');
  });

  it('shows the category-specific done status after toggling complete', async () => {
    component['toggle']();
    fixture.detectChanges();
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Lost grace discovered');
    expect(text).toContain('Undo');
  });

  it('shows a per-marker image, or a collectible category icon, but not the placeholder', () => {
    const headerSrc = (marker: Marker, category: MarkerCategory): string | null => {
      const f = TestBed.createComponent(MarkerDetailComponent);
      f.componentInstance.marker = marker;
      f.componentInstance.category = category;
      f.detectChanges();
      return (
        (f.nativeElement as HTMLElement)
          .querySelector<HTMLImageElement>('.marker-detail__image')
          ?.getAttribute('src') ?? null
      );
    };

    // grace: no marker image, no group -> no header image
    expect(headerSrc(MARKER, CATEGORY)).toBeNull();

    expect(
      headerSrc(
        { ...MARKER, id: 'boss-1', image: 'assets/marker-images/boss/x.jpg' },
        { ...CATEGORY, id: 'bosses' },
      ),
    ).toBe('assets/marker-images/boss/x.jpg');

    expect(
      headerSrc(
        { ...MARKER, id: 'gs-1' },
        { ...CATEGORY, id: 'golden-seeds', group: 'seeds-tears', icon: 'assets/markers/golden-seeds.png' },
      ),
    ).toBe('assets/markers/golden-seeds.png');

    expect(
      headerSrc(
        { ...MARKER, id: 'bb-1' },
        { ...CATEGORY, id: 'bell-bearings', group: 'kit', icon: 'assets/markers/placeholder.svg' },
      ),
    ).toBeNull();
  });

  it('offers the bonus step only after the marker is complete, and tracks it apart from completion', async () => {
    component.category = {
      ...CATEGORY,
      id: 'merchants',
      completion: { action: 'Mark as found', doneStatus: 'Merchant found' },
      bonusStep: {
        id: 'bell',
        action: 'Claim Bell Bearing',
        doneStatus: 'Bell Bearing claimed',
        note: 'Requires defeating the merchant.',
      },
    };
    component.marker = { ...MARKER, id: 'merchant-1' };
    fixture.detectChanges();

    let text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text()).not.toContain('Claim Bell Bearing');

    component['toggle'](); // found
    fixture.detectChanges();
    await fixture.whenStable();
    expect(text()).toContain('Merchant found');
    expect(text()).toContain('Claim Bell Bearing');
    expect(text()).toContain('Requires defeating the merchant.');
    expect(component['bonusDone']()).toBe(false);

    component['toggleBonus']();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(text()).toContain('Bell Bearing claimed');
    expect(component['done']()).toBe(true);
    expect(component['bonusDone']()).toBe(true);
  });

  it('a per-marker completion override wins over the category default', async () => {
    component.category = {
      ...CATEGORY,
      id: 'bosses',
      completion: { action: 'Mark boss as felled', doneStatus: 'Enemy Felled' },
    };
    component.marker = {
      ...MARKER,
      id: 'boss-1',
      completion: { action: 'Mark boss as felled', doneStatus: 'Demigod Felled' },
    };
    component['toggle']();
    fixture.detectChanges();
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Demigod Felled');
    expect(text).not.toContain('Enemy Felled');
  });
});
