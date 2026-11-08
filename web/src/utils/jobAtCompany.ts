import i18next from 'i18next';

/**
 * "Job title at Company" label for an application, in the active language.
 * Falls back to whichever part is set, then to an empty string. Call it at
 * render time so it follows language changes.
 */
export const formatJobAtCompany = (
  jobTitle?: string | null,
  companyName?: string | null,
): string =>
  jobTitle && companyName
    ? i18next.t('app:applications.jobAtCompany', { jobTitle, companyName })
    : jobTitle || companyName || '';
