import { type CSSProperties, useState } from 'react';

import { Avatar } from '../../atoms/profile-custom/Avatar';
import { Field, Input } from '../../atoms/profile-custom/Input';
import { BANNER_PRESETS } from './constants';

const ACCENT_COLORS = [
  { name: 'Blue', value: '#2B70C9' },
  { name: 'Green', value: '#1D9E75' },
  { name: 'Orange', value: '#D85A30' },
  { name: 'Pink', value: '#D4537E' },
  { name: 'Yellow', value: '#BA7517' },
  { name: 'Purple', value: '#7F77DD' },
  { name: 'Gray', value: '#555555' },
];

interface AppearanceSettingsProps {
  avatarColor: string;
  bannerGradient: string;
  initials: string;
  onColorChange: (c: string) => void;
  onBannerChange: (g: string) => void;
}

/**
 * AppearanceSettings Component
 * Manages the visual aspect of the profile (Avatar colors, Banner presets, Visibility).
 */
export const AppearanceSettings = ({
  avatarColor,
  bannerGradient,
  initials,
  onColorChange,
  onBannerChange,
}: AppearanceSettingsProps) => {
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>(
    'public',
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Colors of avatar */}
      <section style={subCardStyle}>
        <h3 style={sectionTitleStyle}>Profile color</h3>
        <p style={descStyle}>Choose your avatar and accent color</p>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onColorChange(c.value)}
              aria-label={`Use color ${c.name}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: c.value,
                cursor: 'pointer',
                border:
                  avatarColor === c.value
                    ? '2.5px solid var(--color-text)'
                    : '2px solid transparent',
              }}
            />
          ))}
        </div>
        <Field label="Custom color" htmlFor="custom-color">
          <Input
            id="custom-color"
            type="color"
            accentColor={avatarColor}
            value={avatarColor}
            onChange={(e) => onColorChange(e.target.value)}
            style={{ height: 36, padding: 2, cursor: 'pointer' }}
          />
        </Field>
      </section>

      {/* Preview Section */}
      <section style={subCardStyle}>
        <h3 style={sectionTitleStyle}>Avatar preview</h3>
        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-end',
            marginTop: 16,
          }}
        >
          {[
            { size: 60, label: 'Large' },
            { size: 40, label: 'Medium' },
            { size: 26, label: 'Small' },
          ].map(({ size, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <Avatar initials={initials} color={avatarColor} size={size} />
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-weaker)',
                  marginTop: 6,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--color-text-weaker)',
              marginBottom: 8,
            }}
          >
            Banner preview
          </div>
          <div
            style={{ height: 50, borderRadius: 8, background: bannerGradient }}
          />
        </div>
      </section>

      {/* Banner Selection */}
      <section style={subCardStyle}>
        <h3 style={sectionTitleStyle}>Profile banner</h3>
        <p style={descStyle}>Choose a theme for your banner</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BANNER_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => onBannerChange(value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'transparent',
                cursor: 'pointer',
                border:
                  bannerGradient === value
                    ? '1.5px solid var(--color-text)'
                    : '0.5px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 4,
                  background: value,
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: 13, color: 'var(--color-text)' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Visibility Settings */}
      <section style={subCardStyle}>
        <h3 style={sectionTitleStyle}>Profile visibility</h3>
        <p style={descStyle}>Who can view your profile?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
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
          ].map(({ value, label, desc }) => (
            <label
              key={value}
              htmlFor={`visibility-${value}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                id={`visibility-${value}`}
                type="radio"
                name="visibility"
                aria-label={label}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                style={{ marginTop: 2 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--color-text-weaker)' }}
                >
                  {desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};

const subCardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 10,
  padding: '16px 18px',
  border: '0.5px solid var(--color-border)',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '0.5px solid var(--color-border)',
};

const descStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-weaker)',
  marginBottom: 12,
};
