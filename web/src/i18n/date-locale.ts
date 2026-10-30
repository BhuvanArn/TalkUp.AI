import type { Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

import type { Language } from './config';

/** `date-fns` locale for each supported language. */
export const DATE_FNS_LOCALES: Record<Language, Locale> = {
  en: enUS,
  fr,
};

/** BCP-47 tag passed to `Intl.*` and `toLocale*String()` for each language. */
export const INTL_LOCALES: Record<Language, string> = {
  en: 'en-US',
  fr: 'fr-FR',
};

export interface DateLocale {
  /** Active UI language */
  language: Language;
  /** Pass as `{ locale }` to `date-fns` `format()` and friends */
  dateFnsLocale: Locale;
  /** Pass to `Intl.DateTimeFormat`, `Intl.NumberFormat`, `toLocale*String()` */
  intlLocale: string;
}

/**
 * Locale settings for formatting dates and numbers in a given language.
 * Outside React (utils, stores), call it with `getLanguage()`; in components,
 * use the `useDateLocale()` hook, which re-renders on language change.
 *
 * @example
 * ```ts
 * const { dateFnsLocale, intlLocale } = getDateLocale(getLanguage());
 * format(date, 'd MMM yyyy', { locale: dateFnsLocale });
 * new Intl.NumberFormat(intlLocale).format(1234);
 * ```
 */
export const getDateLocale = (language: Language): DateLocale => ({
  language,
  dateFnsLocale: DATE_FNS_LOCALES[language],
  intlLocale: INTL_LOCALES[language],
});
