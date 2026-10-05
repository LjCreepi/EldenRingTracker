import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LoadoutService } from './loadout.service';

describe('LoadoutService', () => {
  let service: LoadoutService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadoutService);
  });

  it('equips and unequips a slot', () => {
    service.equip('right-hand-1', 'longsword');
    expect(service.slot('right-hand-1')).toBe('longsword');
    service.equip('right-hand-1', null);
    expect(service.slot('right-hand-1')).toBeUndefined();
  });

  it('drops the Ash of War when its armament is unequipped', () => {
    service.equip('right-hand-1', 'longsword');
    service.setAshOfWar('right-hand-1', 'ash-of-war-lions-claw');
    expect(service.loadout().ashesOfWar['right-hand-1']).toBe('ash-of-war-lions-claw');

    service.equip('right-hand-1', null);
    expect(service.loadout().ashesOfWar['right-hand-1']).toBeUndefined();
  });

  it('adds each memorised spell at most once and can forget it', () => {
    service.addSpell('rock-sling');
    service.addSpell('rock-sling');
    expect(service.loadout().spells).toEqual(['rock-sling']);
    service.removeSpell('rock-sling');
    expect(service.loadout().spells).toEqual([]);
  });

  it('seeds a default armament build when a weapon is equipped, and resets it on swap', () => {
    service.equip('right-hand-1', 'longsword');
    const build = service.armamentBuild('right-hand-1');
    expect(build).toEqual({
      upgradeLevel: 0,
      upgradePath: 'standard',
      affinity: 'standard',
      twoHanded: false,
    });

    service.setArmamentBuild('right-hand-1', { ...build!, upgradeLevel: 15, twoHanded: true });
    expect(service.armamentBuild('right-hand-1')?.upgradeLevel).toBe(15);

    // Equipping a different weapon into the same slot resets its build.
    service.equip('right-hand-1', 'moonveil');
    expect(service.armamentBuild('right-hand-1')).toEqual({
      upgradeLevel: 0,
      upgradePath: 'somber', // moonveil is in the curated Somber list
      affinity: 'standard',
      twoHanded: false,
    });
  });

  it('drops the armament build when the slot is unequipped', () => {
    service.equip('right-hand-1', 'longsword');
    service.equip('right-hand-1', null);
    expect(service.armamentBuild('right-hand-1')).toBeUndefined();
  });

  it('lists every equipped item id and persists across instances', () => {
    service.equip('head', 'helm');
    service.addSpell('glintstone-pebble');
    TestBed.inject(ApplicationRef).tick();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(LoadoutService);
    expect(reloaded.equippedItemIds()).toEqual(
      expect.arrayContaining(['helm', 'glintstone-pebble']),
    );

    reloaded.resetActive();
    expect(reloaded.equippedItemIds()).toEqual([]);
  });
});
