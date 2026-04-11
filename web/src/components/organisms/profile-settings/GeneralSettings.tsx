import React from 'react';

/**
 * @interface GeneralSettingsProps
 * @description Defines the configuration and event handlers for the GeneralSettings component.
 */
interface GeneralSettingsProps {
  /** User's given name */
  firstName: string;
  /** User's family name */
  lastName: string;
  /** User's professional summary or biography */
  bio: string;
  /** User's contact phone number */
  phoneNumber: string;
  /** Background color for the avatar placeholder (Hex or CSS color) */
  avatarColor: string;
  /** Callback fired when the first name input value changes */
  onFirstNameChange: (value: string) => void;
  /** Callback fired when the last name input value changes */
  onLastNameChange: (value: string) => void;
  /** Callback fired when the bio textarea value changes */
  onBioChange: (value: string) => void;
  /** Callback fired when the phone number input value changes */
  onPhoneNumberChange: (value: string) => void;
  /** Optional callback to trigger the profile picture upload process */
  onAvatarChange?: () => void;
  /** Optional callback to remove the current profile picture */
  onAvatarDelete?: () => void;
}

/**
 * GeneralSettings Component
 * * Provides an interface for updating core user profile information.
 * @param {GeneralSettingsProps} props - Component properties
 * @returns {JSX.Element} The rendered general settings form
 */
export function GeneralSettings({
  firstName,
  lastName,
  bio,
  phoneNumber,
  avatarColor,
  onFirstNameChange,
  onLastNameChange,
  onBioChange,
  onPhoneNumberChange,
}: GeneralSettingsProps) {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Identity Section ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={sectionTitleStyle}>Identity</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              style={inputStyle}
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              style={inputStyle}
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
            />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="username">
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-weakest)',
              }}
            >
              @
            </span>
            <input
              id="username"
              style={{
                ...inputStyle,
                paddingLeft: '30px',
                color: 'var(--color-text-weaker)',
              }}
              value={`${firstName.toLowerCase()}.${lastName.toLowerCase()}`}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ── About & Contact Section ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={sectionTitleStyle}>About & Contact</h3>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            maxLength={300}
          />
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-text-weakest)',
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {bio.length} / 300
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              style={inputStyle}
              placeholder="+33 6 00 00 00 00"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="linkedin">
              LinkedIn URL
            </label>
            <input
              id="linkedin"
              style={inputStyle}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="job-title">
            Job title
          </label>
          <select id="job-title" style={inputStyle}>
            <option>Product Manager Candidate</option>
            <option>Product Designer</option>
            <option>Software Engineer</option>
          </select>
        </div>
      </div>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: '8px',
  marginBottom: '4px',
};
const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};
const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-weak)',
};
const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};
