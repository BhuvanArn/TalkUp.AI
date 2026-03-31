import { useState } from 'react';

import { Avatar } from '../../atoms/profile-custom/Avatar';
import { Field, Input } from '../../atoms/profile-custom/Input';

const ACCENT_COLORS = [
  '#2B70C9',
  '#1D9E75',
  '#D85A30',
  '#D4537E',
  '#BA7517',
  '#7F77DD',
  '#555555',
];

const BANNER_PRESETS = [
  {
    label: 'Océan',
    value: 'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
  },
  {
    label: 'Coucher',
    value: 'linear-gradient(135deg, #D85A30 0%, #BA7517 100%)',
  },
  { label: 'Nuit', value: 'linear-gradient(135deg, #3b1f6e 0%, #2B70C9 100%)' },
  {
    label: 'Forêt',
    value: 'linear-gradient(135deg, #1D9E75 0%, #3B6D11 100%)',
  },
  { label: 'Rose', value: 'linear-gradient(135deg, #D4537E 0%, #BA7517 100%)' },
];

interface ApparenceSettingsProps {
  avatarColor: string;
  bannerGradient: string;
  initials: string;
  onColorChange: (c: string) => void;
  onBannerChange: (g: string) => void;
}

export const ApparenceSettings = ({
  avatarColor,
  bannerGradient,
  initials,
  onColorChange,
  onBannerChange,
}: ApparenceSettingsProps) => {
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>(
    'public',
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Colors of avatar */}
      <div style={subCardStyle}>
        <div style={sectionTitleStyle}>Couleur du profil</div>
        <p style={descStyle}>Couleur de ton avatar et accents</p>
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
              key={c}
              onClick={() => onColorChange(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: c,
                cursor: 'pointer',
                border:
                  avatarColor === c
                    ? '2.5px solid var(--color-text-primary)'
                    : '2px solid transparent',
              }}
            />
          ))}
        </div>
        <Field label="Couleur personnalisée">
          <Input
            type="color"
            accentColor={avatarColor}
            value={avatarColor}
            onChange={(e) => onColorChange(e.target.value)}
            style={{ height: 36, padding: 2, cursor: 'pointer' }}
          />
        </Field>
      </div>

      {/* Aperence */}
      <div style={subCardStyle}>
        <div style={sectionTitleStyle}>Aperçu avatar</div>
        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-end',
            marginTop: 16,
          }}
        >
          {[
            { size: 60, label: 'Grand' },
            { size: 40, label: 'Moyen' },
            { size: 26, label: 'Petit' },
          ].map(({ size, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <Avatar initials={initials} color={avatarColor} size={size} />
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
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
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}
          >
            Aperçu bannière
          </div>
          <div
            style={{ height: 50, borderRadius: 8, background: bannerGradient }}
          />
        </div>
      </div>

      <div style={subCardStyle}>
        <div style={sectionTitleStyle}>Bannière du profil</div>
        <p style={descStyle}>Choisis un thème pour ta bannière</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BANNER_PRESETS.map(({ label, value }) => (
            <button
              key={label}
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
                    ? '1.5px solid var(--color-text-primary)'
                    : '0.5px solid var(--color-border-secondary)',
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
                style={{ fontSize: 13, color: 'var(--color-text-primary)' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={subCardStyle}>
        <div style={sectionTitleStyle}>Visibilité du profil</div>
        <p style={descStyle}>Qui peut voir ton profil ?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              value: 'public' as const,
              label: 'Public',
              desc: 'Visible par les recruteurs et la communauté',
            },
            {
              value: 'private' as const,
              label: 'Privé',
              desc: 'Uniquement toi et tes recruteurs associés',
            },
            {
              value: 'hidden' as const,
              label: 'Masqué',
              desc: 'Profil non indexé',
            },
          ].map(({ value, label, desc }) => (
            <label
              key={value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="visibility"
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                style={{ marginTop: 2 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
                >
                  {desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const subCardStyle: React.CSSProperties = {
  background: 'var(--color-background-secondary)',
  borderRadius: 10,
  padding: '16px 18px',
  border: '0.5px solid var(--color-border-tertiary)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '0.5px solid var(--color-border-tertiary)',
};

const descStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  marginBottom: 12,
};
