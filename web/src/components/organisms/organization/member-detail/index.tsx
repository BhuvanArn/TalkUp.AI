import { Icon } from '@/components/atoms/icon';
import { useLocale } from '@/hooks/i18n/useLocale';
import type { OrganizationMemberDetail } from '@/services/organization/types';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const EMPTY = '·';

const formatDateTime = (iso: string | null, intlLocale: string) =>
  iso ? new Date(iso).toLocaleString(intlLocale) : EMPTY;

const formatScore = (score: number | null | undefined, intlLocale: string) =>
  score != null ? new Intl.NumberFormat(intlLocale).format(score) : EMPTY;

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
  const { t } = useTranslation(['settings', 'common']);
  const { intlLocale } = useLocale();

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
        aria-label={t('memberDetail.closeBackdrop')}
        /* `scrim` is the non-inverting overlay token — the `black` token is
           theme-inverted (near-white in dark mode) and unsafe for a scrim */
        className="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('memberDetail.title')}
        className="animate-fadeIn relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-lg"
      >
        <button
          type="button"
          aria-label={t('common:actions.close')}
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-text-weaker transition-colors hover:bg-surface-hover hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon icon="times" size="sm" />
        </button>

        {isError ? (
          <p className="text-body-m text-error">
            {t('memberDetail.loadError')}
          </p>
        ) : isLoading || !detail ? (
          <p className="text-body-m text-text-weaker">
            {t('memberDetail.loading')}
          </p>
        ) : (
          <>
            <header className="pr-8">
              <h3 className="text-h4 text-text">{detail.username}</h3>
              <p className="text-body-s capitalize text-text-weaker">
                {t(`organization.roleNames.${detail.user_role}`)}
                {detail.email ? ` · ${detail.email}` : ''}
              </p>
            </header>

            <dl className="grid grid-cols-2 gap-4 text-body-s">
              <div>
                <dt className="text-text-weaker">
                  {t('organization.stats.interviews')}
                </dt>
                <dd className="text-h5 text-text">
                  {detail.stats.interviewCount}
                </dd>
              </div>
              <div>
                <dt className="text-text-weaker">
                  {t('organization.stats.completed')}
                </dt>
                <dd className="text-h5 text-text">
                  {detail.stats.completedCount}
                </dd>
              </div>
              <div>
                <dt className="text-text-weaker">
                  {t('organization.stats.avgScore')}
                </dt>
                <dd className="text-h5 text-text">
                  {formatScore(detail.stats.avgScore, intlLocale)}
                </dd>
              </div>
              <div>
                <dt className="text-text-weaker">
                  {t('organization.stats.lastActivity')}
                </dt>
                <dd className="text-h5 text-text">
                  {formatDateTime(detail.stats.lastActivityAt, intlLocale)}
                </dd>
              </div>
            </dl>

            <section className="flex flex-col gap-2">
              <h4 className="text-body-s-strong text-text">
                {t('memberDetail.recentInterviews')}
              </h4>
              {detail.recentInterviews.length === 0 ? (
                <p className="text-body-s text-text-weaker">
                  {t('memberDetail.noInterviews')}
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
                        {formatScore(iv.score, intlLocale)}
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
