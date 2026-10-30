import { getLocale } from '@/i18n/locale';
import { act, renderHook } from '@testing-library/react';
import { enUS, fr } from 'date-fns/locale';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { useLocale } from './useLocale';

describe('getLocale', () => {
  it.each([
    ['en', enUS, 'en-US'],
    ['fr', fr, 'fr-FR'],
  ] as const)('maps %s', (language, dateFnsLocale, intlLocale) => {
    expect(getLocale(language)).toEqual({
      language,
      dateFnsLocale,
      intlLocale,
    });
  });

  it('returns the same object on every call', () => {
    expect(getLocale('fr')).toBe(getLocale('fr'));
  });
});

describe('useLocale', () => {
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
  });

  it('follows the active language', async () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.intlLocale).toBe('en-US');
    expect(result.current.dateFnsLocale).toBe(enUS);

    await act(() => i18next.changeLanguage('fr'));

    expect(result.current.language).toBe('fr');
    expect(result.current.intlLocale).toBe('fr-FR');
    expect(result.current.dateFnsLocale).toBe(fr);
  });
});
