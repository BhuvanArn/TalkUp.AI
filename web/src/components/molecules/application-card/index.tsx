import { iconMap } from '@/components/atoms/icon/icon-map';
import { ConfirmModal } from '@/components/molecules/confirm-modal';
import type {
  Application,
  ApplicationStatus,
} from '@/services/applications/types';
import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns/format';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { enUS } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: 'Sent',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

/** Same glyph vocabulary as the kanban column headers, so a status reads the
 * same in the menu as on the board. */
const STATUS_ICONS: Record<
  ApplicationStatus,
  (typeof iconMap)[keyof typeof iconMap]
> = {
  sent: iconMap.send,
  interview: iconMap.schedule,
  accepted: iconMap['check-circle'],
  rejected: iconMap.times,
};

const CalendarIcon = iconMap.schedule;
const DragIcon = iconMap.applications;
const ChevronIcon = iconMap['caret-down'];
const TrashIcon = iconMap.delete;

interface ApplicationCardProps {
  application: Application;
  /** True while a status/delete mutation for THIS card is in flight — freezes
   * menu and drag so concurrent edits can't race. */
  isPending: boolean;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
  onDelete: (applicationId: string) => void;
  onInterviewAtChange: (
    applicationId: string,
    interviewAt: string | null,
  ) => void;
  onOpenTraining: (applicationId: string) => void;
}

/** `<input type="date">` wants YYYY-MM-DD; derive it from the stored ISO. */
const toDateInputValue = (iso: string | null): string =>
  iso ? format(new Date(iso), 'yyyy-MM-dd') : '';

/**
 * Kanban card for one job application. A clearly bounded header (company + role)
 * is the drag handle between status columns; below it sit the applied date, an
 * interview-date row, the training link, and a ▾ menu (status fallback, set
 * interview date, delete with inline confirm).
 */
export const ApplicationCard = ({
  application,
  isPending,
  onStatusChange,
  onDelete,
  onInterviewAtChange,
  onOpenTraining,
}: ApplicationCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

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
  };

  // Close the menu on an outside click or Escape so it behaves like a real
  // popover instead of lingering until the trigger is clicked again.
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuContainerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background border-border rounded-xl border p-3 ${
        isDragging ? 'z-10 opacity-80 shadow-lg' : ''
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Bounded, grab-cursor header = the drag handle. The raised surface and
            border make it obvious this block is what you pick up and move. */}
        <div
          {...listeners}
          {...attributes}
          className="bg-surface-raised border-border hover:border-border-strong group flex min-w-0 flex-1 cursor-grab items-center gap-2.5 rounded-lg border p-2 transition-colors active:cursor-grabbing"
        >
          <span
            aria-hidden="true"
            className="bg-background text-primary text-body-s-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display"
          >
            {(application.companyName ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-body-m text-text block truncate font-bold font-display">
              {application.companyName ?? 'Unknown company'}
            </span>
            <span className="text-body-s text-text-idle block truncate">
              {application.jobTitle ?? 'Role not specified'}
            </span>
          </span>
          <DragIcon
            size={15}
            aria-hidden="true"
            className="text-text-weakest shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>

        <div className="relative" ref={menuContainerRef}>
          <button
            type="button"
            aria-label="Application actions"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            disabled={isPending}
            onClick={() => (isMenuOpen ? closeMenu() : setIsMenuOpen(true))}
            className={`text-text-weakest hover:text-text hover:bg-surface flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed ${
              isMenuOpen ? 'bg-surface text-text' : ''
            }`}
          >
            <ChevronIcon
              size={16}
              aria-hidden="true"
              className={`transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isMenuOpen && (
            <div
              role="menu"
              className="bg-background border-border absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border py-1.5 shadow-xl"
            >
              <p className="text-body-s text-text-weakest px-3 pt-1 pb-1.5 font-semibold tracking-wide uppercase">
                Move to
              </p>
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[])
                .filter((status) => status !== application.status)
                .map((status) => {
                  const StatusIcon = STATUS_ICONS[status];
                  return (
                    <button
                      key={status}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onStatusChange(application.applicationId, status);
                        closeMenu();
                      }}
                      className="text-body-s text-text hover:bg-surface flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left"
                    >
                      <StatusIcon
                        size={15}
                        aria-hidden="true"
                        className="text-text-weak shrink-0"
                      />
                      {STATUS_LABELS[status]}
                    </button>
                  );
                })}

              <hr className="border-border my-1.5" />
              <div className="flex items-center gap-2.5 px-3 py-1">
                <CalendarIcon
                  size={15}
                  aria-hidden="true"
                  className="text-text-weak shrink-0"
                />
                <input
                  type="date"
                  aria-label="Interview date"
                  value={toDateInputValue(application.interviewAt)}
                  onChange={(e) => {
                    const val = e.target.value;
                    onInterviewAtChange(
                      application.applicationId,
                      val ? new Date(val).toISOString() : null,
                    );
                  }}
                  className="text-body-s text-text bg-surface border-border focus-visible:border-accent min-w-0 flex-1 cursor-pointer rounded border px-2 py-1 outline-none"
                />
                {application.interviewAt && (
                  <button
                    type="button"
                    aria-label="Clear interview date"
                    title="Clear interview date"
                    onClick={() =>
                      onInterviewAtChange(application.applicationId, null)
                    }
                    className="text-text-weakest hover:text-text shrink-0 cursor-pointer rounded px-1"
                  >
                    <iconMap.times size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              <hr className="border-border my-1.5" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  setIsDeleteModalOpen(true);
                }}
                className="text-body-s text-error hover:bg-error-weaker flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left"
              >
                <TrashIcon size={15} aria-hidden="true" className="shrink-0" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete this application?"
        message={`This removes ${
          application.companyName ?? 'this application'
        } and its training progress. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="error"
        icon="trash"
        onConfirm={() => {
          onDelete(application.applicationId);
          setIsDeleteModalOpen(false);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Interview status: an explicit scheduled/not-scheduled line, most useful
          in the Interview column but shown whenever a date is set. */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <CalendarIcon
          size={14}
          aria-hidden="true"
          className={
            application.interviewAt ? 'text-accent' : 'text-text-weakest'
          }
        />
        {application.interviewAt ? (
          <span className="text-body-s text-text-weak">
            Interview on{' '}
            {format(new Date(application.interviewAt), 'd MMM yyyy', {
              locale: enUS,
            })}
          </span>
        ) : (
          <span className="text-body-s text-text-weakest">
            No interview scheduled
          </span>
        )}
      </div>

      <div className="border-border mt-2.5 flex items-center justify-between border-t pt-2">
        <button
          type="button"
          onClick={() => onOpenTraining(application.applicationId)}
          className="text-body-s-strong text-accent hover:text-accent-hover cursor-pointer"
        >
          Resume training
        </button>
        <span className="text-body-s text-text-weakest">
          Sent{' '}
          {formatDistanceToNow(new Date(application.appliedAt), {
            addSuffix: true,
            locale: enUS,
          })}
        </span>
      </div>
    </div>
  );
};
