import type {
  Application,
  ApplicationStatus,
} from '@/services/applications/types';
import { useDraggable } from '@dnd-kit/core';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { enUS } from 'date-fns/locale';
import { useState } from 'react';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: 'Sent',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

interface ApplicationCardProps {
  application: Application;
  /** True while a status/delete mutation for THIS card is in flight — freezes
   * menu and drag so concurrent edits can't race. */
  isPending: boolean;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
  onDelete: (applicationId: string) => void;
  onOpenTraining: (applicationId: string) => void;
}

/**
 * Kanban card for one job application: company, role, dates, a ▾ menu
 * (status fallback for keyboard/mobile + delete with inline confirm) and the
 * training link. Draggable between status columns via @dnd-kit.
 */
export const ApplicationCard = ({
  application,
  isPending,
  onStatusChange,
  onDelete,
  onOpenTraining,
}: ApplicationCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: application.applicationId,
      disabled: isPending,
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsConfirmingDelete(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background border-border rounded-xl border p-3 ${
        isDragging ? 'z-10 opacity-80 shadow-lg' : ''
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          {...listeners}
          {...attributes}
          className="flex min-w-0 flex-1 cursor-grab items-center gap-2.5 active:cursor-grabbing"
        >
          <span
            aria-hidden="true"
            className="bg-surface-raised text-primary text-body-s-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display"
          >
            {(application.companyName ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="text-body-m text-text block truncate font-bold font-display">
              {application.companyName ?? 'Unknown company'}
            </span>
            <span className="text-body-s text-text-idle block truncate">
              {application.jobTitle ?? 'Role not specified'}
            </span>
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Application actions"
            aria-expanded={isMenuOpen}
            disabled={isPending}
            onClick={() => (isMenuOpen ? closeMenu() : setIsMenuOpen(true))}
            className="text-text-weakest hover:text-text rounded px-1 disabled:cursor-not-allowed"
          >
            ▾
          </button>
          {isMenuOpen && (
            <div className="bg-background border-border absolute right-0 z-20 mt-1 w-52 rounded-lg border py-1 shadow-lg">
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[])
                .filter((status) => status !== application.status)
                .map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onStatusChange(application.applicationId, status);
                      closeMenu();
                    }}
                    className="text-body-s text-text hover:bg-surface block w-full px-3 py-1.5 text-left"
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              <hr className="border-border my-1" />
              {isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(application.applicationId);
                    closeMenu();
                  }}
                  className="text-body-s text-error hover:bg-surface block w-full px-3 py-1.5 text-left font-bold"
                >
                  Confirm deletion
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-body-s text-error hover:bg-surface block w-full px-3 py-1.5 text-left"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-body-s text-text-weakest mt-2">
        Sent{' '}
        {formatDistanceToNow(new Date(application.appliedAt), {
          addSuffix: true,
          locale: enUS,
        })}
      </p>

      <div className="border-border mt-2.5 flex items-center justify-between border-t pt-2">
        <button
          type="button"
          onClick={() => onOpenTraining(application.applicationId)}
          className="text-body-s-strong text-accent hover:text-accent-hover"
        >
          Resume training
        </button>
        <span className="text-body-s text-text-weakest">
          Updated{' '}
          {formatDistanceToNow(new Date(application.updatedAt), {
            addSuffix: true,
            locale: enUS,
          })}
        </span>
      </div>
    </div>
  );
};
