import { Button } from "../../atoms/profile-custom/Button";

import React from 'react';

interface TopbarProps {
  onSave: () => void;
  isSaved: boolean;
  accentColor?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onSave, isSaved, accentColor = "#2B70C9" }) => {
  return (
    <div style={topbarStyle}>
      <div style={breadcrumbStyle}>
        <span style={folderStyle}>Paramètres</span>
        <span style={separatorStyle}>/</span>
        <span style={currentPageStyle}>Mon Profil</span>
      </div>

      <div style={actionsStyle}>
        <Button 
          variant="ghost" 
          style={{ color: "#6B7280", fontSize: "13px" }}
        >
          Annuler
        </Button>
        
        <Button 
          onClick={onSave} 
          accentColor={accentColor}
          style={saveButtonStyle}
        >
          {isSaved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Enregistré
            </span>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </div>
    </div>
  );
};

const topbarStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderBottom: "1px solid #E5E7EB",
  padding: "0 32px",
  height: "64px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  fontFamily: "Inter, sans-serif",
};

const folderStyle: React.CSSProperties = {
  color: "#6B7280", // Gris moyen
};

const separatorStyle: React.CSSProperties = {
  color: "#D1D5DB", // Gris très clair
};

const currentPageStyle: React.CSSProperties = {
  color: "#111827", // Noir/Gris très foncé
  fontWeight: 500,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const saveButtonStyle: React.CSSProperties = {
  minWidth: "180px",
  height: "38px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 500,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
};

export default Topbar;