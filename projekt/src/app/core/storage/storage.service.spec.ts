import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('returns the fallback when nothing is stored', () => {
    expect(service.read('missing', 42)).toBe(42);
  });

  it('round-trips a value through localStorage', () => {
    service.write('user', { name: 'Ranni' });
    expect(service.read('user', null)).toEqual({ name: 'Ranni' });
  });

  it('namespaces keys so it does not clash with other storage', () => {
    service.write('k', 1);
    expect(localStorage.getItem('ert.k')).toBe('1');
    expect(localStorage.getItem('k')).toBeNull();
  });

  it('returns the fallback when the stored JSON is corrupt', () => {
    localStorage.setItem('ert.broken', '{not json');
    expect(service.read('broken', 'safe')).toBe('safe');
  });

  it('removes a key', () => {
    service.write('temp', 'x');
    service.remove('temp');
    expect(service.read('temp', null)).toBeNull();
  });
});
