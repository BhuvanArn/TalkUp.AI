import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import usePersonaStore from './usePersonaStore';

describe('usePersonaStore', () => {
  beforeEach(() => {
    act(() => usePersonaStore.getState().clearPersona());
    window.sessionStorage.clear();
  });

  it('starts with no persona selected', () => {
    const { result } = renderHook(() => usePersonaStore());
    expect(result.current.selectedPersonaId).toBeNull();
  });

  it('stores a selected persona id', () => {
    const { result } = renderHook(() => usePersonaStore());
    act(() => result.current.setPersona('marc-bernard'));
    expect(result.current.selectedPersonaId).toBe('marc-bernard');
  });

  it('clears the selection', () => {
    const { result } = renderHook(() => usePersonaStore());
    act(() => result.current.setPersona('marc-bernard'));
    act(() => result.current.clearPersona());
    expect(result.current.selectedPersonaId).toBeNull();
  });

  it('persists to sessionStorage, not localStorage', () => {
    const { result } = renderHook(() => usePersonaStore());
    act(() => result.current.setPersona('claire-dubois'));

    expect(window.sessionStorage.getItem('persona-storage')).toContain(
      'claire-dubois',
    );
    expect(window.localStorage.getItem('persona-storage')).toBeNull();
  });
});
