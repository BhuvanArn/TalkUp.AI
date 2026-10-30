import { getLanguage } from '@/i18n';
import { type AppLocale, getLocale } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

/**
 * Locale settings for the active UI language: the `date-fns` locale and the
 * BCP-47 tag for `Intl` / `toLocale*String()`. Re-renders when the language
 * changes.
 *
 * @example
 * ```tsx
 * const { dateFnsLocale, intlLocale } = useLocale();
 * format(date, 'd MMM yyyy', { locale: dateFnsLocale });
 * date.toLocaleDateString(intlLocale, { weekday: 'long' });
 * ```
 */
export const useLocale = (): AppLocale => {
  const { i18n } = useTranslation();
  return getLocale(getLanguage(i18n));
};
