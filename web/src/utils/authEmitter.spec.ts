import { afterEach, describe, expect, it, vi } from 'vitest';

import { emit, hasListeners, subscribe } from './authEmitter';

describe('authEmitter', () => {
  const unsubs: Array<() => void> = [];

  afterEach(() => {
    unsubs.forEach((u) => u());
    unsubs.length = 0;
  });

  it('delivers emitted values to subscribers', () => {
    const fn = vi.fn();
    unsubs.push(subscribe(fn));
    emit(true);
    expect(fn).toHaveBeenCalledWith(true);
    emit(false);
    expect(fn).toHaveBeenLastCalledWith(false);
  });

  it('unsubscribe stops further events', () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    unsub();
    emit(true);
    expect(fn).not.toHaveBeenCalled();
  });

  it('hasListeners reflects subscription count', () => {
    expect(hasListeners()).toBe(false);
    unsubs.push(subscribe(() => {}));
    expect(hasListeners()).toBe(true);
  });

  it('catches listener errors and logs', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unsubs.push(
      subscribe(() => {
        throw new Error('listener boom');
      }),
    );
    expect(() => emit(true)).not.toThrow();
    expect(errSpy).toHaveBeenCalledWith(
      'Auth listener failed:',
      expect.any(Error),
    );
    errSpy.mockRestore();
  });
});
