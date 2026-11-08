const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats a 0-100 value as a whole percentage in the given locale:
 * "72%" in `en-US`, "72 %" (no-break space) in `fr-FR`. Pass
 * `intlLocale` from `useLocale()` so the text follows language changes.
 *
 * @example
 * ```tsx
 * const { intlLocale } = useLocale();
 * formatPercent(72, intlLocale); // "72%" / "72 %"
 * ```
 */
export const formatPercent = (value: number, intlLocale: string): string => {
  let formatter = formatters.get(intlLocale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale, {
      style: 'percent',
      maximumFractionDigits: 0,
    });
    formatters.set(intlLocale, formatter);
  }
  return formatter.format(value / 100);
};
