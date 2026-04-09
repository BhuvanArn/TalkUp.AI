import React from 'react';

import { Button } from '../../atoms/profile-custom/Button';

/**
 * @interface TopbarProps
 * @description Defines the properties for the Topbar component, including dynamic breadcrumbs.
 */
interface TopbarProps {
  /** Array of strings representing the navigation path (e.g., ['Settings', 'Profile']) */
  breadcrumb?: string[];
  /** Callback function triggered when the save button is clicked */
  onSave: () => void;
  /** Boolean indicating if changes are currently saved for UI feedback */
  isSaved: boolean;
  /** Theme color used for the primary action button */
  accentColor?: string;
}

/**
 * Topbar component providing navigation context and global actions.
 */
export const Topbar: React.FC<TopbarProps> = ({
  breadcrumb = ['Paramètres', 'Mon Profil'],
  onSave,
  isSaved,
  accentColor = '#2B70C9',
}) => {
  return (
    <header style={topbarStyle}>
      <nav aria-label="Breadcrumb" style={breadcrumbStyle}>
        {breadcrumb.map((item, index) => (
          <React.Fragment key={item}>
            <span
              style={
                index === breadcrumb.length - 1 ? currentPageStyle : folderStyle
              }
            >
              {item}
            </span>
            {index < breadcrumb.length - 1 && (
              <span style={separatorStyle} aria-hidden="true">
                /
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div style={actionsStyle}>
        <Button
          variant="ghost"
          style={{ color: 'var(--color-text-weaker)', fontSize: '13px' }}
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Enregistré
            </span>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>
    </header>
  );
};

const topbarStyle: React.CSSProperties = {
  background: 'var(--color-background)',
  borderBottom: '1px solid var(--color-border)',
  padding: '0 32px',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const breadcrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
};

const folderStyle: React.CSSProperties = {
  color: 'var(--color-text-weaker)',
};

const separatorStyle: React.CSSProperties = {
  color: 'var(--color-border-strong)',
};

const currentPageStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontWeight: 500,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const saveButtonStyle: React.CSSProperties = {
  minWidth: '180px',
  height: '38px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

export default Topbar;
