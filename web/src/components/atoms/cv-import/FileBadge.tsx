import React from 'react';

/**
 * @interface FileBadgeProps
 * @description Properties for the FileBadge component.
 */
interface FileBadgeProps {
  /** The text label to display (e.g., "PDF", "DOCX") */
  label: string;
}

/**
 * FileBadge Atom
 * @description A small, stylized container used to display supported file extensions.
 * @param {FileBadgeProps} props - Component properties.
 * @returns {JSX.Element} The rendered badge.
 */
export const FileBadge = ({ label }: FileBadgeProps) => (
  <span style={badgeStyle}>{label}</span>
);

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#F1F5F9',
  color: '#475569',
  padding: '4px 12px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};
