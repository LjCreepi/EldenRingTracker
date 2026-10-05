import { TestBed } from '@angular/core/testing';
import { CharacterService } from '../character/character.service';
import { startingClass } from '../models/character-sheet.model';
import { CharacterSheetService } from './character-sheet.service';

describe('CharacterSheetService', () => {
  let characters: CharacterService;
  let service: CharacterSheetService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    characters = TestBed.inject(CharacterService);
    characters.create('Tester', 'astrologer');
    service = TestBed.inject(CharacterSheetService);
  });

  it('starts every attribute at the character class base', () => {
    expect(service.startingClass().id).toBe('astrologer');
    expect(service.sheet().attributes).toEqual(
      startingClass('astrologer').attributes,
    );
    expect(service.level()).toBe(startingClass('astrologer').level);
  });

  it('never lets an attribute drop below the class base or above 99', () => {
    const baseInt = startingClass('astrologer').attributes.intelligence;
    service.setAttribute('intelligence', 5);
    expect(service.sheet().attributes.intelligence).toBe(baseInt);
    service.setAttribute('intelligence', 250);
    expect(service.sheet().attributes.intelligence).toBe(99);
  });

  it('adjustAttribute steps within bounds and moves the level', () => {
    const base = startingClass('astrologer');
    service.adjustAttribute('mind', 3);
    expect(service.sheet().attributes.mind).toBe(base.attributes.mind + 3);
    expect(service.level()).toBe(base.level + 3);
    service.adjustAttribute('mind', -99);
    expect(service.sheet().attributes.mind).toBe(base.attributes.mind);
  });

  it('resets the active character back to its class base', () => {
    service.adjustAttribute('mind', 5);
    service.resetActive();
    expect(service.sheet().attributes).toEqual(
      startingClass('astrologer').attributes,
    );
  });

  it('reports the level of any character, for the switcher', () => {
    const warriorId = characters.create('Two', 'warrior');
    expect(service.levelOf(warriorId)).toBe(startingClass('warrior').level);
  });
});
