import { afterEach, describe, expect, it, vi } from 'vitest';

import { safeLocalStorage, safeSessionStorage } from './safeStorage';

const blocked = () => new DOMException('Access is denied', 'SecurityError');

describe.each([
  ['localStorage', safeLocalStorage],
  ['sessionStorage', safeSessionStorage],
] as const)('safe %s', (name, storage) => {
  afterEach(() => {
    vi.restoreAllMocks();
    storage.removeItem('key');
    window[name].clear();
  });

  it('reads and writes the real storage when it works', () => {
    storage.setItem('key', 'value');
    expect(window[name].getItem('key')).toBe('value');
    expect(storage.getItem('key')).toBe('value');
    storage.removeItem('key');
    expect(window[name].getItem('key')).toBeNull();
  });

  // Chrome/Firefox with cookies blocked throw on the getter itself.
  it('keeps values in memory when the storage getter throws', () => {
    vi.spyOn(window, name, 'get').mockImplementation(() => {
      throw blocked();
    });
    expect(() => storage.setItem('key', 'value')).not.toThrow();
    expect(storage.getItem('key')).toBe('value');
    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('keeps values in memory when the Storage methods throw', () => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw blocked();
      });
    }
    expect(() => storage.setItem('key', 'value')).not.toThrow();
    expect(storage.getItem('key')).toBe('value');
    expect(() => storage.removeItem('key')).not.toThrow();
    expect(storage.getItem('key')).toBeNull();
  });

  it('drops the in-memory copy once a write succeeds again', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw blocked();
      });
    storage.setItem('key', 'old');
    setItem.mockRestore();
    storage.setItem('key', 'new');
    window[name].removeItem('key'); // e.g. cleared by another tab
    expect(storage.getItem('key')).toBeNull();
  });

  it('returns the new value when only writes fail (quota)', () => {
    window[name].setItem('key', 'old');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    storage.setItem('key', 'new');
    expect(storage.getItem('key')).toBe('new');
  });
});
