import { Icon } from '@/components/atoms/icon';
import type { OrganizationMemberDetail } from '@/services/organization/types';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const EMPTY = '·';

const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : EMPTY;

/**
 * F14: profile basics + stats + recent interviews for one member, shown in a
 * modal so the members table can use the full page width. Renders nothing when
 * closed; closes on backdrop click or Escape.
 */
export const MemberDetail = ({
  isOpen,
  detail,
  isLoading,
  isError,
  onClose,
}: {
  isOpen: boolean;
  detail: OrganizationMemberDetail | undefined;
  isLoading: boolean;
  isError?: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close member details"
        /* literal black — the `black` token is theme-inverted (near-white in
           dark mode), so it can't be used for a scrim */
        className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Member details"
        className="animate-fadeIn relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-lg"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-text-weaker transition-colors hover:bg-surface-hover hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon icon="times" size="sm" />
        </button>

        {isError ? (
          <p className="text-body-m text-error">
            Couldn&apos;t load this member&apos;s details. Please try again.
          </p>
        ) : isLoading || !detail ? (
          <p className="text-body-m text-text-weaker">Loading member…</p>
        ) : (
          <>
            <header className="pr-8">
              <h3 className="text-h4 text-text">{detail.username}</h3>
              <p className="text-body-s capitalize text-text-weaker">
                {detail.user_role}
                {detail.email ? ` · ${detail.email}` : ''}
              </p>
            </header>

            <dl className="grid grid-cols-2 gap-4 text-body-s">
              <div>
                <dt className="text-text-weaker">Interviews</dt>
                <dd className="text-h5 text-text">
                  {detail.stats.interviewCount}
                </dd>
              </div>
              <div>
                <dt className="text-text-weaker">Completed</dt>
                <dd className="text-h5 text-text">
                  {detail.stats.completedCount}
                </dd>
              </div>
              <div>
                <dt className="text-text-weaker">Average score</dt>
                <dd className="text-h5 text-text">
                  {detail.stats.avgScore ?? EMPTY}
                </dd>
              </div>
              <div>
                <dt className="text-text-weaker">Last activity</dt>
                <dd className="text-h5 text-text">
                  {formatDateTime(detail.stats.lastActivityAt)}
                </dd>
              </div>
            </dl>

            <section className="flex flex-col gap-2">
              <h4 className="text-body-s-strong text-text">
                Recent interviews
              </h4>
              {detail.recentInterviews.length === 0 ? (
                <p className="text-body-s text-text-weaker">
                  No interviews yet.
                </p>
              ) : (
                <ul className="flex flex-col text-body-s">
                  {detail.recentInterviews.map((iv) => (
                    <li
                      key={iv.interview_id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-border py-2 first:border-t-0"
                    >
                      <span className="truncate text-text">{iv.type}</span>
                      <span className="text-text-weaker">{iv.status}</span>
                      <span className="tabular-nums text-text">
                        {iv.score ?? EMPTY}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default MemberDetail;
