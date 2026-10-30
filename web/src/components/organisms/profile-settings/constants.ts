import type { ParseKeys } from 'i18next';

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
