import { Avatar } from '@/components/atoms/avatar';
import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import { cn } from '@/utils/cn';

import { BANNER_PRESETS } from './constants';

export type ProfileVisibilityValue = 'public' | 'private' | 'hidden';

const ACCENT_COLORS = [
  { name: 'Blue', value: '#2B70C9' },
  { name: 'Green', value: '#1D9E75' },
  { name: 'Orange', value: '#D85A30' },
  { name: 'Pink', value: '#D4537E' },
  { name: 'Yellow', value: '#BA7517' },
  { name: 'Purple', value: '#7F77DD' },
  { name: 'Gray', value: '#555555' },
] as const;

const AVATAR_PREVIEW_SIZES = [
  { label: 'Large', className: '!h-[60px] !w-[60px] !text-[22px]' },
  { label: 'Medium', className: '!h-10 !w-10 !text-base' },
  { label: 'Small', className: '!h-[26px] !w-[26px] !text-[10px]' },
] as const;

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
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>Profile color</h3>
        <p className={descClass}>Choose your avatar and accent color</p>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {ACCENT_COLORS.map((c) => (
            <Button
              key={c.value}
              type="button"
              variant="text"
              color="neutral"
              aria-label={`Use color ${c.name}`}
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
            Custom color
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
        <h3 className={sectionTitleClass}>Avatar preview</h3>
        <div className="mt-4 flex items-end gap-5">
          {AVATAR_PREVIEW_SIZES.map(({ label, className }) => (
            <div key={label} className="text-center">
              <Avatar
                src={profilePictureSrc ?? undefined}
                alt="Avatar preview"
                fallback={initials}
                size="md"
                className={cn('shrink-0 font-bold text-white', className)}
                style={{ backgroundColor: avatarColor }}
              />
              <div className="mt-1.5 text-[11px] text-text-weaker">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-text-weaker">
            Banner preview
          </div>
          <div
            className="h-[50px] rounded-lg"
            style={{ background: bannerGradient }}
          />
        </div>
      </section>

      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>Profile banner</h3>
        <p className={descClass}>Choose a theme for your banner</p>
        <div className="flex flex-col gap-2">
          {BANNER_PRESETS.map(({ label, value }) => (
            <button
              key={label}
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
              <span className="text-body-s text-text">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={subCardClass}>
        <h3 className={sectionTitleClass}>Profile visibility</h3>
        <p className={descClass}>Who can view your profile?</p>
        <div className="flex flex-col gap-3">
          {(
            [
              {
                value: 'public' as const,
                label: 'Public',
                desc: 'Visible to recruiters and the community',
              },
              {
                value: 'private' as const,
                label: 'Private',
                desc: 'Visible only to you and your associated recruiters',
              },
              {
                value: 'hidden' as const,
                label: 'Hidden',
                desc: 'Profile is not indexed',
              },
            ] as const
          ).map(({ value, label, desc }) => (
            <label
              key={value}
              htmlFor={`visibility-${value}`}
              className="flex cursor-pointer items-start gap-2.5"
            >
              <input
                id={`visibility-${value}`}
                type="radio"
                name="visibility"
                aria-label={label}
                checked={profileVisibility === value}
                onChange={() => onProfileVisibilityChange(value)}
                className="mt-0.5"
              />
              <div>
                <div className="text-body-s font-medium text-text">{label}</div>
                <div className="text-xs text-text-weaker">{desc}</div>
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
