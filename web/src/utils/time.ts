import { getLanguage } from '@/i18n';
import { getLocale } from '@/i18n/locale';
import i18next from 'i18next';

/**
 * Formats a time duration (e.g., seconds) into a human-readable string (e.g., 00:03:45).
 * (Assuming this is your original function)
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/**
 * Converts elapsed time (in seconds) into an ISO 8601 Duration string (e.g., "PT1M30S").
 * (The function I provided in the previous turn)
 */
export const formatDurationISO = (seconds: number): string => {
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);

  let duration = 'P';
  duration += 'T';

  if (h > 0) duration += `${h}H`;
  if (m > 0) duration += `${m}M`;
  if (s >= 0) duration += `${s}S`;

  if (duration === 'PT') return 'PT0S';

  return duration;
};

/**
 * Formats a date relative to now (e.g., "Just now", "5h ago", "3d ago", "Jan 15")
 * in the active UI language.
 */
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return i18next.t('app:time.justNow');
  } else if (diffInHours < 24) {
    return i18next.t('app:time.hoursAgo', { hours: diffInHours });
  } else if (diffInDays < 7) {
    return i18next.t('app:time.daysAgo', { days: diffInDays });
  } else {
    return date.toLocaleDateString(getLocale(getLanguage()).intlLocale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
};
