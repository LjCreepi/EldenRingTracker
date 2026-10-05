import { TestBed } from '@angular/core/testing';
import { CharacterService } from './character.service';

describe('CharacterService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts empty — the Onboarding Wizard handles the first run', () => {
    const service = TestBed.inject(CharacterService);
    expect(service.characters()).toHaveLength(0);
    expect(service.hasAny()).toBe(false);
    expect(service.activeId()).toBe('');
  });

  it('creates a character, makes it active, stores the name raw, shows it censored', () => {
    const service = TestBed.inject(CharacterService);
    const id = service.create('Knight', 'warrior');

    expect(service.activeId()).toBe(id);
    expect(service.hasAny()).toBe(true);
    expect(service.rawName(id)).toBe('Knight');
    expect(service.activeCharacter()?.name).toBe('K***ht');
    expect(service.activeCharacter()?.classId).toBe('warrior');
  });

  it('trims and caps the name at 16 characters on create', () => {
    const service = TestBed.inject(CharacterService);
    const id = service.create('  a very long ranger name  ', 'hero');
    expect(service.rawName(id)).toBe('a very long rang');
  });

  it('renames via the mirror, ignoring an empty name', () => {
    const service = TestBed.inject(CharacterService);
    const id = service.create('Aldric', 'confessor');
    service.rename(id, 'Millicent');
    expect(service.rawName(id)).toBe('Millicent');
    service.rename(id, '   ');
    expect(service.rawName(id)).toBe('Millicent');
  });

  it('never changes a class after creation (there is no API for it)', () => {
    const service = TestBed.inject(CharacterService);
    const id = service.create('Fixed', 'prophet');
    // Only rawName is mutable; classId has no setter.
    expect(service.characters()[0].classId).toBe('prophet');
    service.rename(id, 'Still Fixed');
    expect(service.characters()[0].classId).toBe('prophet');
  });

  it('repoints the active character to the newest survivor on delete', () => {
    const service = TestBed.inject(CharacterService);
    const a = service.create('A', 'vagabond');
    service.create('B', 'vagabond');
    const c = service.create('C', 'vagabond');

    service.setActive(a);
    service.remove(a);
    expect(service.activeId()).toBe(c);
  });

  it('goes back to empty when the last character is deleted', () => {
    const service = TestBed.inject(CharacterService);
    const only = service.create('Last', 'wretch');
    service.remove(only);
    expect(service.hasAny()).toBe(false);
    expect(service.activeId()).toBe('');
  });

  it('migrates a ≤0.4.0 save: name → rawName, class from the old sheet', () => {
    localStorage.setItem(
      'ert.characters',
      JSON.stringify([
        { id: 'c1', name: 'Old Save', createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    );
    localStorage.setItem(
      'ert.characterSheet',
      JSON.stringify({ c1: { classId: 'astrologer', attributes: {} } }),
    );

    const service = TestBed.inject(CharacterService);
    expect(service.rawName('c1')).toBe('Old Save');
    expect(service.characters()[0].classId).toBe('astrologer');
  });

  it('migrates a sheet-less legacy character to the default class', () => {
    localStorage.setItem(
      'ert.characters',
      JSON.stringify([
        { id: 'c9', name: 'Nameless', createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    );

    const service = TestBed.inject(CharacterService);
    expect(service.characters()[0].classId).toBe('vagabond');
  });
});
