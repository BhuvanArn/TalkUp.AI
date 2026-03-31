import React from "react";
import { Button } from "../../atoms/profile-custom/Button";

/**
 * @interface GeneralSettingsProps
 */
interface GeneralSettingsProps {
  firstName: string;
  lastName: string;
  bio: string;
  phoneNumber: string; // Ajouté
  avatarColor: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void; // Ajouté
  onAvatarChange?: () => void;
  onAvatarDelete?: () => void;
}

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
  onAvatarChange,
  onAvatarDelete,
}: GeneralSettingsProps) {
  const initials = (firstName[0] || "") + (lastName[0] || "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* ── Section Avatar (Réintégrée avec boutons) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: "50%", background: avatarColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "white", flexShrink: 0
        }}>
          {initials.toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="primary" onClick={onAvatarChange}>
            Changer la photo
          </Button>
          <Button variant="secondary" onClick={onAvatarDelete}>
            Supprimer
          </Button>
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

      {/* ── Section À propos & Contact ── */}
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
          {/* Nouveau champ Téléphone */}
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

// ... Styles identiques à ton fichier d'origine
const sectionTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#111827", borderBottom: "1px solid #F3F4F6", paddingBottom: "8px", marginBottom: "4px" };
const inputGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#4B5563" };
const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: 14, outline: "none", transition: "border-color 0.2s", background: "#F9FAFB", color: "#111827" };