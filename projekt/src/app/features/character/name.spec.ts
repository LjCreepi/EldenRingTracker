import {
  censorName,
  isValidName,
  nameMatchesForConfirm,
  normalizeName,
} from './name';

describe('character name rules', () => {
  it('trims and caps at 16 characters', () => {
    expect(normalizeName('  Ranger  ')).toBe('Ranger');
    expect(normalizeName('a very long ranger name')).toBe('a very long rang');
    expect(normalizeName('a very long ranger name')).toHaveLength(16);
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(isValidName('Tarnished')).toBe(true);
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('')).toBe(false);
  });

  it('masks filtered substrings on display, length-preserved, case-insensitive', () => {
    expect(censorName('Knight')).toBe('K***ht'); // the joke
    expect(censorName('MIDNIGHT')).toBe('MID***HT');
    expect(censorName('Fagan')).toBe('***an');
  });

  it('leaves ordinary Elden Ring names alone', () => {
    expect(censorName('Let Me Solo Her')).toBe('Let Me Solo Her');
    expect(censorName('Millicent')).toBe('Millicent');
  });

  it('accepts either the real name or its masked form to confirm a delete', () => {
    expect(nameMatchesForConfirm('Knight', 'Knight')).toBe(true);
    expect(nameMatchesForConfirm('K***ht', 'Knight')).toBe(true);
    expect(nameMatchesForConfirm('  Knight  ', 'Knight')).toBe(true);
    expect(nameMatchesForConfirm('knight', 'Knight')).toBe(false); // case-sensitive
    expect(nameMatchesForConfirm('Other', 'Knight')).toBe(false);
  });
});
