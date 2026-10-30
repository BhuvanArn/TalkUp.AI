import type { ParseKeys } from 'i18next';

/**
 * Job titles offered in the profile selector. `value` is what the profile
 * stores (always English); `labelKey` is what the UI shows. "Product Manager
 * Candidate" stays because older profiles stored it as a default (#204).
 */
export const JOB_OPTIONS = [
  {
    value: 'Product Manager Candidate',
    labelKey: 'generalSettings.jobOptions.productManagerCandidate',
  },
  {
    value: 'Product Designer',
    labelKey: 'generalSettings.jobOptions.productDesigner',
  },
  {
    value: 'Software Engineer',
    labelKey: 'generalSettings.jobOptions.softwareEngineer',
  },
] as const satisfies readonly {
  value: string;
  labelKey: ParseKeys<'settings'>;
}[];

export const BANNER_PRESETS = [
  { labelKey: 'appearanceSettings.banner.presets.minimal', value: '#FFFFFF' },
  {
    labelKey: 'appearanceSettings.banner.presets.ocean',
    value: 'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
  },
  {
    labelKey: 'appearanceSettings.banner.presets.night',
    value: 'linear-gradient(135deg, #3b1f6e 0%, #2B70C9 100%)',
  },
] as const satisfies readonly {
  labelKey: ParseKeys<'settings'>;
  value: string;
}[];
