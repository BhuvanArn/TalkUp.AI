import { getDateLocale } from '@/i18n/date-locale';
import { act, renderHook } from '@testing-library/react';
import { enUS, fr } from 'date-fns/locale';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { useDateLocale } from './useDateLocale';

describe('getDateLocale', () => {
  it.each([
    ['en', enUS, 'en-US'],
    ['fr', fr, 'fr-FR'],
  ] as const)('maps %s', (language, dateFnsLocale, intlLocale) => {
    expect(getDateLocale(language)).toEqual({
      language,
      dateFnsLocale,
      intlLocale,
    });
  });
});

describe('useDateLocale', () => {
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
  });

  it('follows the active language', async () => {
    const { result } = renderHook(() => useDateLocale());
    expect(result.current.intlLocale).toBe('en-US');
    expect(result.current.dateFnsLocale).toBe(enUS);

    await act(() => i18next.changeLanguage('fr'));

    expect(result.current.language).toBe('fr');
    expect(result.current.intlLocale).toBe('fr-FR');
    expect(result.current.dateFnsLocale).toBe(fr);
  });
});
