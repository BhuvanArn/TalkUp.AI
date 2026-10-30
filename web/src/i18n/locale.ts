import type { Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

import type { Language } from './config';

export interface AppLocale {
  /** Active UI language */
  language: Language;
  /** Pass as `{ locale }` to `date-fns` `format()` and friends */
  dateFnsLocale: Locale;
  /** BCP-47 tag for `Intl.DateTimeFormat`, `Intl.NumberFormat`, `toLocale*String()` */
  intlLocale: string;
}

/** Built once, so `getLocale()` returns a stable object per language. */
const LOCALES: Record<Language, AppLocale> = {
  en: { language: 'en', dateFnsLocale: enUS, intlLocale: 'en-US' },
  fr: { language: 'fr', dateFnsLocale: fr, intlLocale: 'fr-FR' },
};

/**
 * Locale settings for formatting dates and numbers in a given language. The
 * returned object is the same on every call for a given language.
 * Outside React (utils, stores), call it with `getLanguage()`; in components,
 * use the `useLocale()` hook, which re-renders on language change.
 *
 * @example
 * ```ts
 * const { dateFnsLocale, intlLocale } = getLocale(getLanguage());
 * format(date, 'd MMM yyyy', { locale: dateFnsLocale });
 * new Intl.NumberFormat(intlLocale).format(1234);
 * ```
 */
export const getLocale = (language: Language): AppLocale => LOCALES[language];
