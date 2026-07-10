import { cn } from '@/utils/cn';
import React, { useCallback, useState } from 'react';

import { FileBadge } from '../../atoms/cv-import-file-badge';
import { iconMap } from '../../atoms/icon/icon-map';
import { Stepper } from '../../molecules/cv-import-stepper';

const UploadIcon = iconMap.upload;
const CalendarIcon = iconMap.schedule;

/**
 * Props for the UploaderCard component.
 */
interface UploaderCardProps {
  /** Callback triggered when a file is successfully selected or dropped. */
  onFileSelect: (file: File) => void;
  /** Current step in the multi-step analysis process. Defaults to 1. */
  step?: number;
  /** The application deadline date. */
  deadline?: Date | null;
  /** Callback triggered when the deadline date is changed or cleared. */
  onDeadlineChange?: (date: Date | null) => void;
}

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * UploaderCard Component
 * Provides a drag-and-drop interface for CV uploading and an optional
 * deadline picker to help users prioritize their job applications.
 */
export const UploaderCard = ({
  onFileSelect,
  step = 1,
  deadline,
  onDeadlineChange,
}: UploaderCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates file size and format before calling onFileSelect.
   *
   * NOTE: This is a best-effort *client-side* gate only. The MIME-type and
   * extension checks are trivially spoofable; the authoritative validation must
   * happen server-side on the actual upload once that endpoint exists.
   */
  const validateAndProcessFile = useCallback(
    (file: File) => {
      setError(null);

      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isValidType =
        ALLOWED_MIME_TYPES.includes(file.type) ||
        ALLOWED_EXTENSIONS.includes(fileExtension);

      if (!isValidType) {
        setError(
          'Unsupported file format. Please use a PDF, DOC or DOCX file.',
        );
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError(`File is too large. Maximum size: ${MAX_SIZE_MB} MB.`);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect],
  );

  /**
   * Converts a Date object to a string format compatible with HTML date inputs (YYYY-MM-DD).
   */
  const toInputValue = (date?: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Calculates the number of days between today and the provided deadline.
   */
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

  /**
   * Toggles the dragging state visually when a file is hovered over the zone.
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  /**
   * Processes the dropped file and triggers validation.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.[0]) {
        validateAndProcessFile(e.dataTransfer.files[0]);
      }
    },
    [validateAndProcessFile],
  );

  /**
   * Returns the token-based color classes for the urgency badge.
   */
  const getUrgencyClass = (): string => {
    if (daysRemaining === null) return '';
    if (daysRemaining < 0) return 'bg-error-weak text-error';
    if (daysRemaining <= 3) return 'bg-warning-weak text-warning';
    return 'bg-success-weak text-success';
  };

  /**
   * Returns a user-friendly label for the deadline urgency.
   */
  const getUrgencyLabel = (): string => {
    if (daysRemaining === null) return '';
    if (daysRemaining < 0) return 'Overdue';
    if (daysRemaining === 0) return 'Today!';
    if (daysRemaining === 1) return 'Tomorrow!';
    return `${daysRemaining} days left`;
  };

  return (
    <div className="bg-background w-full max-w-[800px] overflow-hidden rounded-3xl border border-border">
      <Stepper currentStep={step} />

      {/* ── Drop zone ── */}
      <div
        className={cn(
          'px-10 pt-10 pb-8 transition-colors',
          isDragging && 'bg-surface',
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div
          className={cn(
            'flex flex-col items-center rounded-2xl border-2 border-dashed px-5 py-15 text-center transition-colors',
            isDragging ? 'border-accent' : 'border-border',
          )}
        >
          <div className="bg-surface mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
            <UploadIcon size={32} className="text-success" aria-hidden="true" />
          </div>

          <h3 className="text-body-xl-strong text-text mb-1">
            Drag and drop your CV here
          </h3>
          <p className="text-body-m text-text-weaker m-0">
            or{' '}
            <label
              htmlFor="cv-input"
              className="text-text-link cursor-pointer font-semibold underline"
            >
              browse your files
            </label>
          </p>

          <input
            id="cv-input"
            type="file"
            hidden
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                validateAndProcessFile(e.target.files[0]);
              }
            }}
          />

          <div className="mt-6 mb-3 flex gap-2">
            <FileBadge label="PDF" />
            <FileBadge label="DOCX" />
            <FileBadge label="DOC" />
          </div>

          <span className="text-body-s text-text-weakest">Max size: 5 MB</span>

          {error && (
            <p role="alert" className="text-body-m text-error mt-4 font-medium">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* ── Interview date section ── */}
      <div className="bg-surface border-border mx-10 mb-8 rounded-2xl border p-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarIcon size={16} className="text-accent" aria-hidden="true" />
          <span className="text-body-s-strong text-text flex-1">
            Interview date
          </span>

          {deadline && daysRemaining !== null && (
            <span
              className={cn(
                'text-body-s-strong rounded-full px-2.5 py-0.5',
                getUrgencyClass(),
              )}
            >
              {getUrgencyLabel()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="cv-deadline" className="sr-only">
            Interview date
          </label>
          <input
            id="cv-deadline"
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
            className="text-body-m text-text bg-background border-border-strong focus-visible:border-accent focus-visible:ring-accent flex-1 cursor-pointer rounded-lg border px-3 py-2 outline-none focus-visible:ring-1"
          />
          {deadline && (
            <button
              type="button"
              className="text-text-weakest border-border hover:bg-surface-hover rounded-lg border px-3 py-2 transition-colors"
              onClick={() => onDeadlineChange?.(null)}
              aria-label="Clear date"
              title="Clear date"
            >
              ✕
            </button>
          )}
        </div>

        {!deadline && (
          <p className="text-body-s text-text-weakest mt-2">
            Optional: when is your interview with this company?
          </p>
        )}
        {deadline && daysRemaining !== null && daysRemaining < 0 && (
          <p className="text-body-s text-error mt-2">
            This date is in the past.
          </p>
        )}
      </div>
    </div>
  );
};
