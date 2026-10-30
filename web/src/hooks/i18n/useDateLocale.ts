import { getLanguage } from '@/i18n';
import { type DateLocale, getDateLocale } from '@/i18n/date-locale';
import { useTranslation } from 'react-i18next';

/**
 * Locale settings for the active UI language: the `date-fns` locale and the
 * BCP-47 tag for `Intl` / `toLocale*String()`. Re-renders when the language
 * changes.
 *
 * @example
 * ```tsx
 * const { dateFnsLocale, intlLocale } = useDateLocale();
 * format(date, 'd MMM yyyy', { locale: dateFnsLocale });
 * date.toLocaleDateString(intlLocale, { weekday: 'long' });
 * ```
 */
export const useDateLocale = (): DateLocale => {
  const { i18n } = useTranslation();
  return getDateLocale(getLanguage(i18n));
};
