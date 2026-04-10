import React, { useCallback, useState } from 'react';

import { FileBadge } from '../../atoms/cv-import/FileBadge';
import { Stepper } from '../../molecules/cv-import/Stepper';

/**
 * @interface UploaderCardProps
 * @description Properties for the UploaderCard organism.
 */
interface UploaderCardProps {
  /** Callback function when a file is successfully selected/dropped */
  onFileSelect: (file: File) => void;
  /** Current step of the upload process */
  step?: number;
}

/**
 * UploaderCard Organism
 * @description Main card handling the file upload logic, drag & drop, and stepper state.
 * @param {UploaderCardProps} props - Component properties.
 */
export const UploaderCard = ({ onFileSelect, step = 1 }: UploaderCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect],
  );

  return (
    <div style={cardStyle}>
      <Stepper currentStep={step} />

      <div
        style={{
          ...dropZoneWrapper,
          backgroundColor: isDragging ? '#F0F9FF' : 'transparent',
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div
          style={{
            ...dashedBox,
            borderColor: isDragging ? '#2B70C9' : '#E2E8F0',
          }}
        >
          {/* Upload Icon */}
          <div style={iconCircle}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <h3 style={mainTitle}>Glissez votre CV ici</h3>
          <p style={subTitle}>
            ou{' '}
            <label htmlFor="cv-input" style={browseLink}>
              parcourir vos fichiers
            </label>
          </p>

          <input
            id="cv-input"
            type="file"
            hidden
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              e.target.files?.[0] && onFileSelect(e.target.files[0])
            }
          />

          <div style={badgeContainer}>
            <FileBadge label="PDF" />
            <FileBadge label="DOCX" />
            <FileBadge label="DOC" />
          </div>

          <span style={footerText}>Taille max : 5 Mo</span>
        </div>
      </div>
    </div>
  );
};


const cardStyle: React.CSSProperties = {
  background: '#FFF',
  borderRadius: '24px',
  width: '100%',
  maxWidth: '800px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};
const dropZoneWrapper: React.CSSProperties = {
  padding: '40px',
  transition: 'all 0.2s ease',
};
const dashedBox: React.CSSProperties = {
  border: '2px dashed',
  borderRadius: '20px',
  padding: '60px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};
const iconCircle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: '#F0F9FF',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
};
const mainTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#1E293B',
  margin: '0 0 4px 0',
};
const subTitle: React.CSSProperties = {
  fontSize: '15px',
  color: '#64748B',
  margin: 0,
};
const browseLink: React.CSSProperties = {
  color: '#2B70C9',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
};
const badgeContainer: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '24px',
  marginBottom: '12px',
};
const footerText: React.CSSProperties = { fontSize: '12px', color: '#94A3B8' };
