import { TestBed } from '@angular/core/testing';
import { PhysickService } from './physick.service';
import { defaultSheet } from '../models/character-sheet.model';

describe('PhysickService', () => {
  let service: PhysickService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhysickService);
  });

  it('starts with an empty, inactive mix', () => {
    expect(service.tearIds()).toEqual([null, null]);
    expect(service.active()).toBe(false);
    expect(service.attributeDeltas()).toEqual({});
  });

  it('applies a knot tear delta only while active', () => {
    service.setTear(0, 'strength-knot-crystal-tear');
    expect(service.attributeDeltas()).toEqual({});

    service.setActive(true);
    expect(service.attributeDeltas()).toEqual({ strength: 10 });

    service.setActive(false);
    expect(service.attributeDeltas()).toEqual({});
  });

  it('stacks two different knot tears', () => {
    service.setTear(0, 'strength-knot-crystal-tear');
    service.setTear(1, 'dexterity-knot-crystal-tear');
    service.setActive(true);
    expect(service.attributeDeltas()).toEqual({ strength: 10, dexterity: 10 });
  });

  it('leaves attributes untouched for a tear with no modeled numeric effect', () => {
    service.setTear(0, 'purifying-crystal-tear');
    service.setActive(true);
    expect(service.attributeDeltas()).toEqual({});
  });

  it('effectiveAttributes applies deltas on top of the base sheet', () => {
    service.setTear(0, 'strength-knot-crystal-tear');
    service.setActive(true);
    const base = defaultSheet('vagabond').attributes;
    const effective = service.effectiveAttributes(base);
    expect(effective.strength).toBe(base.strength + 10);
    expect(effective.dexterity).toBe(base.dexterity);
  });

  it('resets the active character mix', () => {
    service.setTear(0, 'strength-knot-crystal-tear');
    service.setActive(true);
    service.resetActive();
    expect(service.tearIds()).toEqual([null, null]);
    expect(service.active()).toBe(false);
  });
});
