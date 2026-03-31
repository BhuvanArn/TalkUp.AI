import React from "react";
import { Button } from "../../atoms/profile-custom/Button";

/**
 * @interface GeneralSettingsProps
 * @description Properties for the GeneralSettings component to manage user identity and profile details.
 */
interface GeneralSettingsProps {
  /** The user's first name */
  firstName: string;
  /** The user's last name */
  lastName: string;
  /** A short biographical snippet or introduction */
  bio: string;
  /** The user's phone number */
  phoneNumber: string;
  /** The current hex color code for the avatar background */
  avatarColor: string;
  /** Callback function triggered when the first name input changes */
  onFirstNameChange: (value: string) => void;
  /** Callback function triggered when the last name input changes */
  onLastNameChange: (value: string) => void;
  /** Callback function triggered when the bio textarea changes */
  onBioChange: (value: string) => void;
  /** Callback function triggered when the phone number changes */
  onPhoneNumberChange: (value: string) => void;
}

/**
 * GeneralSettings Component
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
  /** Derived initials from first and last name for the avatar fallback */
  const initials = (firstName[0] || "") + (lastName[0] || "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* ── Section Avatar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: "50%", background: avatarColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "white"
        }}>
          {initials.toUpperCase()}
        </div>
      </div>

      {/* ── Section Identité ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={sectionTitleStyle}>Identité</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Prénom</label>
            <input 
              style={inputStyle} 
              value={firstName} 
              onChange={(e) => onFirstNameChange(e.target.value)} 
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Nom</label>
            <input 
              style={inputStyle} 
              value={lastName} 
              onChange={(e) => onLastNameChange(e.target.value)} 
            />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Nom d'utilisateur</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>@</span>
            <input 
              style={{ ...inputStyle, paddingLeft: "30px", color: "#6B7280" }} 
              value={`${firstName.toLowerCase()}.${lastName.toLowerCase()}`} 
              readOnly 
            />
          </div>
        </div>
      </div>

      {/* ── Section À propos ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={sectionTitleStyle}>À propos & Contact</h3>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Bio</label>
          <textarea 
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} 
            value={bio} 
            onChange={(e) => onBioChange(e.target.value)}
            maxLength={300}
          />
          <span style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 }}>
            {bio.length} / 300
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Téléphone</label>
            <input 
              type="tel"
              style={inputStyle} 
              placeholder="+33 6 00 00 00 00"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Lien LinkedIn</label>
            <input style={inputStyle} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Titre professionnel</label>
          <select style={inputStyle}>
            <option>Candidat Product Manager</option>
            <option>Product Designer</option>
            <option>Software Engineer</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Styles (inchangés)
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  borderBottom: "1px solid #F3F4F6",
  paddingBottom: "8px",
  marginBottom: "4px"
};

const inputGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#4B5563"
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
  background: "#F9FAFB",
  color: "#111827"
};