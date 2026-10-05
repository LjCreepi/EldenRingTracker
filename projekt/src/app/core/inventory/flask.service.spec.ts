import { TestBed } from '@angular/core/testing';
import { FlaskService } from './flask.service';
import { InventoryService } from './inventory.service';

describe('FlaskService', () => {
  let service: FlaskService;
  let inventory: InventoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlaskService);
    inventory = TestBed.inject(InventoryService);
  });

  it('starts at the base 3 charges and tier 0 potency', () => {
    expect(service.flaskCharges()).toBe(3);
    expect(service.flaskPotencyTier()).toBe(0);
  });

  it('refuses to use a Golden Seed that is not held', () => {
    service.useGoldenSeed();
    expect(service.goldenSeedsUsed()).toBe(0);
  });

  it('using a held Golden Seed moves it from Inventory to Used and raises charges', () => {
    inventory.add('golden-seed', 3);
    service.useGoldenSeed();
    service.useGoldenSeed();
    service.useGoldenSeed();

    expect(inventory.quantity('golden-seed')).toBe(0);
    expect(service.goldenSeedsUsed()).toBe(3);
    expect(service.flaskCharges()).toBe(6); // base 3 + 3 levels at cost 1 each
  });

  it('un-using a Golden Seed restores it to Inventory and lowers charges', () => {
    inventory.add('golden-seed', 1);
    service.useGoldenSeed();
    service.unuseGoldenSeed();

    expect(inventory.quantity('golden-seed')).toBe(1);
    expect(service.goldenSeedsUsed()).toBe(0);
    expect(service.flaskCharges()).toBe(3);
  });

  it('using Sacred Tears raises the Flask Potency tier', () => {
    inventory.add('sacred-tear', 2);
    service.useSacredTear();
    service.useSacredTear();

    expect(inventory.quantity('sacred-tear')).toBe(0);
    expect(service.flaskPotencyTier()).toBe(2); // costs 1, 1 for tiers 1-2
  });

  it('resets usage for the active character', () => {
    inventory.add('golden-seed', 1);
    service.useGoldenSeed();
    service.resetActive();
    expect(service.goldenSeedsUsed()).toBe(0);
  });
});
