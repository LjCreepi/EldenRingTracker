import { Attributes, startingClass } from '../../core/models/character-sheet.model';
import { Item } from '../../core/models/item.model';
import { defaultArmamentBuild } from '../../core/models/weapon-build.model';
import {
  derivedLevel,
  derivedStats,
  flaskCharges,
  flaskPotencyTier,
  loadState,
  maxEquipLoad,
  maxHp,
  weaponAttackRating,
} from './stats';

const ZERO_ATTRIBUTES: Attributes = {
  vigor: 0, mind: 0, endurance: 0, strength: 0, dexterity: 0,
  intelligence: 0, faith: 0, arcane: 0,
};

const longsword: Item = {
  id: 'longsword',
  name: 'Longsword',
  category: 'melee-armaments',
  attack: { Phy: 110, Crit: 100 },
  scaling: { Str: 'D', Dex: 'D' },
};

const armor = (weight: number, poise = 0): Item => ({
  id: `a${weight}`,
  name: 'Armor',
  category: 'chest-armor',
  weight,
  resistance: { Poise: poise },
});

describe('character stats', () => {
  it('derives Level from class base plus points invested', () => {
    const vagabond = startingClass('vagabond'); // level 9
    expect(derivedLevel(vagabond.attributes, vagabond)).toBe(9);

    const raised = { ...vagabond.attributes, vigor: vagabond.attributes.vigor + 5 };
    expect(derivedLevel(raised, vagabond)).toBe(14);
  });

  it('bands the roll weight by equipped load ratio', () => {
    expect(loadState(20, 100)).toBe('light'); // 20%
    expect(loadState(50, 100)).toBe('medium'); // 50%
    expect(loadState(80, 100)).toBe('heavy'); // 80%
    expect(loadState(100, 100)).toBe('overloaded'); // 100%
    expect(loadState(10, 0)).toBe('overloaded'); // guard: no capacity
  });

  it('interpolates the HP / equip-load curves between anchors and clamps', () => {
    expect(maxHp(1)).toBe(300);
    expect(maxHp(60)).toBe(1900);
    expect(maxHp(200)).toBe(2100); // clamped to the top anchor
    expect(maxEquipLoad(50)).toBe(105);
  });

  it('sums equipped weight and poise into the derived stats', () => {
    const cls = startingClass('vagabond');
    const stats = derivedStats(cls.attributes, cls, {
      equipped: [armor(10, 12), armor(5.5, 8)],
    });
    expect(stats.equipLoad.current).toBe(15.5);
    expect(stats.poise).toBe(20);
    expect(stats.approximate).toBe(true);
    expect(stats.discovery).toBe(100 + cls.attributes.arcane);
  });

  it('weaponAttackRating matches the Longsword\'s real +0 base attack with 0 scaling stats', () => {
    const build = defaultArmamentBuild('longsword');
    const ar = weaponAttackRating(longsword, ZERO_ATTRIBUTES, build);
    expect(ar).not.toBeNull();
    expect(ar!.byType['Phy']).toBe(110); // 0 Str/Dex -> no scaling bonus
    expect(ar!.total).toBe(110);
  });

  it('weaponAttackRating grows with upgrade level using the verified curve', () => {
    const base = weaponAttackRating(longsword, ZERO_ATTRIBUTES, defaultArmamentBuild('longsword'));
    const plus10 = weaponAttackRating(longsword, ZERO_ATTRIBUTES, {
      ...defaultArmamentBuild('longsword'),
      upgradeLevel: 10,
    });
    // Real Longsword +10 Phy is 173 vs +0's 110.
    expect(plus10!.byType['Phy']).toBe(173);
    expect(plus10!.byType['Phy']).toBeGreaterThan(base!.byType['Phy']);
  });

  it('weaponAttackRating clamps the upgrade level to the path\'s max', () => {
    const somber = weaponAttackRating(longsword, ZERO_ATTRIBUTES, {
      ...defaultArmamentBuild('longsword'),
      upgradePath: 'somber',
      upgradeLevel: 25,
    });
    expect(somber).not.toBeNull();
    // Should not throw and should use the somber table's last entry (+10).
  });

  it('weaponAttackRating adds more from raised scaling stats', () => {
    const unraised = weaponAttackRating(longsword, ZERO_ATTRIBUTES, defaultArmamentBuild('longsword'));
    const raised = weaponAttackRating(
      longsword,
      { ...ZERO_ATTRIBUTES, strength: 40, dexterity: 40 },
      defaultArmamentBuild('longsword'),
    );
    expect(raised!.total).toBeGreaterThan(unraised!.total);
  });

  it('weaponAttackRating applies the two-handing Strength bonus', () => {
    const oneHanded = weaponAttackRating(
      longsword,
      { ...ZERO_ATTRIBUTES, strength: 40 },
      { ...defaultArmamentBuild('longsword'), twoHanded: false },
    );
    const twoHanded = weaponAttackRating(
      longsword,
      { ...ZERO_ATTRIBUTES, strength: 40 },
      { ...defaultArmamentBuild('longsword'), twoHanded: true },
    );
    expect(twoHanded!.total).toBeGreaterThan(oneHanded!.total);
  });

  it('weaponAttackRating returns null for a non-weapon item', () => {
    const armorItem: Item = { id: 'a', name: 'Armor', category: 'chest-armor' };
    expect(weaponAttackRating(armorItem, ZERO_ATTRIBUTES, defaultArmamentBuild('a'))).toBeNull();
  });

  it('flaskCharges/flaskPotencyTier follow the Golden Seed / Sacred Tear cost tables', () => {
    expect(flaskCharges(0)).toBe(3);
    expect(flaskCharges(3)).toBe(6); // 3 levels at cost 1 each
    expect(flaskPotencyTier(0)).toBe(0);
    expect(flaskPotencyTier(2)).toBe(2); // costs 1, 1
  });
});
