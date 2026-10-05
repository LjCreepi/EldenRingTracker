import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Marker } from '../models/marker.model';
import { MarkerCatalogService } from '../catalog/marker-catalog.service';
import { InventoryService } from '../inventory/inventory.service';
import { ProgressService } from './progress.service';

const boss = (id: string): Marker => ({
  id,
  categoryId: 'bosses',
  layer: 'overworld',
  x: 0,
  y: 0,
  name: id,
});

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressService);
  });

  it('marks a marker complete and back to incomplete', () => {
    expect(service.isComplete('boss-margit')).toBe(false);
    service.toggle('boss-margit');
    expect(service.isComplete('boss-margit')).toBe(true);
    service.toggle('boss-margit');
    expect(service.isComplete('boss-margit')).toBe(false);
  });

  it('counts how many of a set are complete', () => {
    service.toggle('a');
    service.toggle('c');
    expect(service.completedCount([boss('a'), boss('b'), boss('c')])).toBe(2);
  });

  it('resets progress for the active character', () => {
    service.toggle('a');
    service.toggle('b');
    service.resetActive();
    expect(service.completed().size).toBe(0);
  });

  it('persists completion across instances', () => {
    service.toggle('boss-godrick');
    TestBed.inject(ApplicationRef).tick();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(ProgressService);
    expect(reloaded.isComplete('boss-godrick')).toBe(true);
  });
});

describe('ProgressService — Marker.itemId links', () => {
  const seedMarker: Marker = {
    id: 'golden-seeds-1-1',
    categoryId: 'golden-seeds',
    layer: 'overworld',
    x: 1,
    y: 1,
    name: 'Golden Seed',
    itemId: 'golden-seed',
  };

  let service: ProgressService;
  let inventory: InventoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MarkerCatalogService,
          useValue: { markers: signal<readonly Marker[]>([seedMarker]) },
        },
      ],
    });
    service = TestBed.inject(ProgressService);
    inventory = TestBed.inject(InventoryService);
  });

  it('adds the linked Item to Inventory on completion', () => {
    expect(inventory.quantity('golden-seed')).toBe(0);
    service.toggle('golden-seeds-1-1');
    expect(inventory.quantity('golden-seed')).toBe(1);
  });

  it('removes the linked Item from Inventory on un-completion', () => {
    service.toggle('golden-seeds-1-1');
    service.toggle('golden-seeds-1-1');
    expect(inventory.quantity('golden-seed')).toBe(0);
  });
});
