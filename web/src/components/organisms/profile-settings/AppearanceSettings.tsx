import { Avatar } from '@/components/atoms/avatar';
import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import { cn } from '@/utils/cn';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { BANNER_PRESETS } from './constants';

export type ProfileVisibilityValue = 'public' | 'private' | 'hidden';

const ACCENT_COLORS = [
  { nameKey: 'appearanceSettings.color.names.blue', value: '#2B70C9' },
  { nameKey: 'appearanceSettings.color.names.green', value: '#1D9E75' },
  { nameKey: 'appearanceSettings.color.names.orange', value: '#D85A30' },
  { nameKey: 'appearanceSettings.color.names.pink', value: '#D4537E' },
  { nameKey: 'appearanceSettings.color.names.yellow', value: '#BA7517' },
  { nameKey: 'appearanceSettings.color.names.purple', value: '#7F77DD' },
  { nameKey: 'appearanceSettings.color.names.gray', value: '#555555' },
] as const satisfies readonly {
  nameKey: ParseKeys<'settings'>;
  value: string;
}[];

const AVATAR_PREVIEW_SIZES = [
  {
    labelKey: 'appearanceSettings.preview.sizes.large',
    className: '!h-[60px] !w-[60px] !text-[22px]',
  },
  {
    labelKey: 'appearanceSettings.preview.sizes.medium',
    className: '!h-10 !w-10 !text-base',
  },
  {
    labelKey: 'appearanceSettings.preview.sizes.small',
    className: '!h-[26px] !w-[26px] !text-[10px]',
  },
] as const satisfies readonly {
  labelKey: ParseKeys<'settings'>;
  className: string;
}[];

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    labelKey: 'appearanceSettings.visibility.public.label',
    descKey: 'appearanceSettings.visibility.public.desc',
  },
  {
    value: 'private',
    labelKey: 'appearanceSettings.visibility.private.label',
    descKey: 'appearanceSettings.visibility.private.desc',
  },
  {
    value: 'hidden',
    labelKey: 'appearanceSettings.visibility.hidden.label',
    descKey: 'appearanceSettings.visibility.hidden.desc',
  },
] as const satisfies readonly {
  value: ProfileVisibilityValue;
  labelKey: ParseKeys<'settings'>;
  descKey: ParseKeys<'settings'>;
}[];

interface AppearanceSettingsProps {
  avatarColor: string;
  bannerGradient: string;
  initials: string;
  profilePictureSrc?: string | null;
  profileVisibility: ProfileVisibilityValue;
  onColorChange: (c: string) => void;
  onBannerChange: (g: string) => void;
  onProfileVisibilityChange: (v: ProfileVisibilityValue) => void;
}

/**
 * AppearanceSettings Component
 * Manages the visual aspect of the profile (Avatar colors, Banner presets, Visibility).
 */
export const AppearanceSettings = ({
  avatarColor,
  bannerGradient,
  initials,
  profilePictureSrc,
  profileVisibility,
  onColorChange,
  onBannerChange,
  onProfileVisibilityChange,
}: AppearanceSettingsProps) => {
  const { t } = useTranslation('settings');
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>
          {t('appearanceSettings.color.title')}
        </h3>
        <p className={descClass}>{t('appearanceSettings.color.desc')}</p>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {ACCENT_COLORS.map((c) => (
            <Button
              key={c.value}
              type="button"
              variant="text"
              color="neutral"
              aria-label={t('appearanceSettings.color.use', {
                name: t(c.nameKey),
              })}
              onClick={() => onColorChange(c.value)}
              className={cn(
                'h-7 w-7 min-h-0 min-w-0 shrink-0 rounded-full border-2 p-0',
                avatarColor === c.value ? 'border-text' : 'border-transparent',
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="custom-color" className="text-label-m text-idle">
            {t('appearanceSettings.color.custom')}
          </label>
          <BaseInput
            id="custom-color"
            name="custom-color"
            type="color"
            value={avatarColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-9 cursor-pointer p-0.5"
            placeholder=""
          />
        </div>
      </section>

      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>
          {t('appearanceSettings.preview.title')}
        </h3>
        <div className="mt-4 flex items-end gap-5">
          {AVATAR_PREVIEW_SIZES.map(({ labelKey, className }) => (
            <div key={labelKey} className="text-center">
              <Avatar
                src={profilePictureSrc ?? undefined}
                alt={t('appearanceSettings.preview.alt')}
                fallback={initials}
                size="md"
                className={cn('shrink-0 font-bold text-white', className)}
                style={{ backgroundColor: avatarColor }}
              />
              <div className="mt-1.5 text-[11px] text-text-weaker">
                {t(labelKey)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-text-weaker">
            {t('appearanceSettings.preview.banner')}
          </div>
          <div
            className="h-[50px] rounded-lg"
            style={{ background: bannerGradient }}
          />
        </div>
      </section>

      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>
          {t('appearanceSettings.banner.title')}
        </h3>
        <p className={descClass}>{t('appearanceSettings.banner.desc')}</p>
        <div className="flex flex-col gap-2">
          {BANNER_PRESETS.map(({ labelKey, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => onBannerChange(value)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border bg-transparent px-3 py-2',
                bannerGradient === value
                  ? 'border-[1.5px] border-text'
                  : 'border-border',
              )}
            >
              <div
                className="h-5 w-9 shrink-0 rounded"
                style={{ background: value }}
              />
              <span className="text-body-s text-text">{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>
          {t('appearanceSettings.visibility.title')}
        </h3>
        <p className={descClass}>{t('appearanceSettings.visibility.desc')}</p>
        <div className="flex flex-col gap-3">
          {VISIBILITY_OPTIONS.map(({ value, labelKey, descKey }) => (
            <label
              key={value}
              htmlFor={`visibility-${value}`}
              className="flex cursor-pointer items-start gap-2.5"
            >
              <input
                id={`visibility-${value}`}
                type="radio"
                name="visibility"
                aria-label={t(labelKey)}
                checked={profileVisibility === value}
                onChange={() => onProfileVisibilityChange(value)}
                className="mt-0.5"
              />
              <div>
                <div className="text-body-s font-medium text-text">
                  {t(labelKey)}
                </div>
                <div className="text-xs text-text-weaker">{t(descKey)}</div>
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};

const subCardClass =
  'rounded-[10px] border border-border bg-surface px-[18px] py-4';

const sectionTitleClass =
  'mb-3 border-b border-border pb-2 text-[13px] font-semibold text-text';

const descClass = 'mb-3 text-xs text-text-weaker';
