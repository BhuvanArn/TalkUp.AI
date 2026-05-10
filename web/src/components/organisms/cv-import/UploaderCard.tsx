import React, { useCallback, useState } from 'react';

import { FileBadge } from '../../atoms/cv-import/FileBadge';
import { Stepper } from '../../molecules/cv-import/Stepper';

interface UploaderCardProps {
  onFileSelect: (file: File) => void;
  step?: number;
  deadline?: Date | null;
  onDeadlineChange?: (date: Date | null) => void;
}

export const UploaderCard = ({
  onFileSelect,
  step = 1,
  deadline,
  onDeadlineChange,
}: UploaderCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const toInputValue = (date?: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysRemaining = (date?: Date | null): number | null => {
    if (!date || isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining(deadline);


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

  const getUrgencyStyle = (): React.CSSProperties => {
    if (daysRemaining === null) return {};
    if (daysRemaining < 0) return { backgroundColor: '#FEE2E2', color: '#DC2626' };
    if (daysRemaining <= 3) return { backgroundColor: '#FEF3C7', color: '#D97706' };
    return { backgroundColor: '#DCFCE7', color: '#16A34A' };
  };

  const getUrgencyLabel = (): string => {
    if (daysRemaining === null) return '';
    if (daysRemaining < 0) return 'Overdue';
    if (daysRemaining === 0) return 'Today!';
    if (daysRemaining === 1) return 'Tomorrow!';
    return `${daysRemaining} days left`;
  };

  return (
    <div style={cardStyle}>
      <Stepper currentStep={step} />

      {/* ── Drop zone ── */}
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

          <h3 style={mainTitle}>Drag and drop your CV here</h3>
          <p style={subTitle}>
            or{' '}
            <label htmlFor="cv-input" style={browseLink}>
              browse your files
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

          <span style={footerText}>Max size: 5 MB</span>
        </div>
      </div>

      {/* ── Deadline section ── */}
      <div style={deadlineSection}>
        <div style={deadlineHeader}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2B70C9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={deadlineTitleStyle}>Application Deadline</span>

          {deadline && daysRemaining !== null && (
            <span style={{ ...urgencyBadge, ...getUrgencyStyle() }}>
              {getUrgencyLabel()}
            </span>
          )}
        </div>

        <div style={deadlineInputRow}>
          <input
            type="date"
            value={toInputValue(deadline)}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onDeadlineChange?.(null);
                return;
              }
              const [year, month, day] = val.split('-').map(Number);
              const newDate = new Date(year, month - 1, day);
              onDeadlineChange?.(newDate);
            }}
            style={dateInput}
          />
          {deadline && (
            <button
              style={clearButton}
              onClick={() => onDeadlineChange?.(null)}
              title="Clear date"
            >
              ✕
            </button>
          )}
        </div>

        {!deadline && (
          <p style={deadlineHint}>Optional — helps prioritize your applications</p>
        )}
        {deadline && daysRemaining !== null && daysRemaining < 0 && (
          <p style={{ ...deadlineHint, color: '#DC2626' }}>
            The deadline has passed.
          </p>
        )}
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
  padding: '40px 40px 32px',
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

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8',
};

const deadlineSection: React.CSSProperties = {
  margin: '0 40px 32px',
  padding: '18px 20px',
  backgroundColor: '#F8FAFF',
  border: '1.5px solid #DBEAFE',
  borderRadius: '16px',
};

const deadlineHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
};

const deadlineTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#1E293B',
  flex: 1,
};

const urgencyBadge: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  padding: '2px 10px',
  borderRadius: '999px',
};

const deadlineInputRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const dateInput: React.CSSProperties = {
  flex: 1,
  padding: '9px 12px',
  fontSize: '14px',
  color: '#1E293B',
  backgroundColor: '#FFFFFF',
  border: '1.5px solid #CBD5E1',
  borderRadius: '10px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const clearButton: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  color: '#94A3B8',
  backgroundColor: 'transparent',
  border: '1.5px solid #E2E8F0',
  borderRadius: '10px',
  cursor: 'pointer',
};

const deadlineHint: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: '12px',
  color: '#94A3B8',
};
