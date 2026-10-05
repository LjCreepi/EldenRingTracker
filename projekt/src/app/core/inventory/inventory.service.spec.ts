import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryService);
  });

  it('adds, stacks and removes items', () => {
    expect(service.has('smithing-stone-1')).toBe(false);
    service.add('smithing-stone-1');
    service.add('smithing-stone-1', 4);
    expect(service.quantity('smithing-stone-1')).toBe(5);

    service.adjust('smithing-stone-1', -2);
    expect(service.quantity('smithing-stone-1')).toBe(3);

    service.remove('smithing-stone-1');
    expect(service.has('smithing-stone-1')).toBe(false);
  });

  it('never goes below zero and floors fractional quantities', () => {
    service.setQuantity('rune-arc', -3);
    expect(service.quantity('rune-arc')).toBe(0);
    service.setQuantity('rune-arc', 2.9);
    expect(service.quantity('rune-arc')).toBe(2);
  });

  it('counts how many of a set are held', () => {
    service.add('a');
    service.add('c');
    expect(service.heldOf(['a', 'b', 'c', 'd'])).toBe(2);
    expect(service.heldCount()).toBe(2);
  });

  it('resets the active character and persists across instances', () => {
    service.add('godrick-great-rune');
    TestBed.inject(ApplicationRef).tick();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(InventoryService);
    expect(reloaded.has('godrick-great-rune')).toBe(true);

    reloaded.resetActive();
    expect(reloaded.heldCount()).toBe(0);
  });
});
