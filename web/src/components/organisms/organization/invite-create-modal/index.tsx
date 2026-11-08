import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

/**
 * F13: create-invite modal. Holds the invite settings form (optional email +
 * role) lifted out of the panel so the invites table can use the full width.
 * Employees may only mint `user` invites; admins additionally get `employee`.
 * Renders nothing when closed; closes on backdrop click or Escape.
 */
export const InviteCreateModal = ({
  isOpen,
  isAdmin,
  isCreating,
  onCreate,
  onClose,
}: {
  isOpen: boolean;
  isAdmin: boolean;
  isCreating: boolean;
  onCreate: (body: {
    email?: string;
    role: 'user' | 'employee';
  }) => Promise<void>;
  onClose: () => void;
}) => {
  const { t } = useTranslation(['settings', 'common']);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'employee'>('user');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Reset the form whenever the modal opens so a fresh invite starts clean.
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole('user');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('inviteCreateModal.closeBackdrop')}
        /* `scrim` is the non-inverting overlay token — the `black` token is
           theme-inverted (near-white in dark mode) and unsafe for a scrim */
        className="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('inviteCreateModal.title')}
        className="animate-fadeIn relative z-10 flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-lg"
      >
        <button
          type="button"
          aria-label={t('common:actions.close')}
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-text-weaker transition-colors hover:bg-surface-hover hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon icon="times" size="sm" />
        </button>

        <header className="pr-8">
          <h3 className="text-h4 text-text">{t('inviteCreateModal.title')}</h3>
          <p className="text-body-s text-text-weaker">
            {t('inviteCreateModal.desc')}
          </p>
        </header>

        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            // Close only once the invite is actually created — on failure the
            // modal stays open (the mutation surfaces its own error toast) so
            // the user can retry instead of the modal vanishing mid-request.
            try {
              await onCreate({ email: email.trim() || undefined, role });
              onClose();
            } catch {
              // Kept open; error is surfaced by the mutation's onError.
            }
          }}
        >
          <label className="flex flex-col gap-1.5 text-body-s text-text-weaker">
            {t('inviteCreateModal.email')}
            <input
              type="email"
              aria-label={t('inviteCreateModal.emailLabel')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('inviteCreateModal.email')}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-body-s text-text transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-body-s text-text-weaker">
            {t('inviteCreateModal.role')}
            <span className="relative inline-flex items-center">
              <select
                aria-label={t('inviteCreateModal.role')}
                className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface py-1.5 pl-3 pr-9 text-body-s text-text transition-colors hover:border-border-strong hover:bg-surface-hover focus:border-accent focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'employee')}
              >
                <option value="user">{t('organization.roleNames.user')}</option>
                {isAdmin && (
                  <option value="employee">
                    {t('organization.roleNames.employee')}
                  </option>
                )}
              </select>
              <Icon
                icon="caret-down"
                size="sm"
                className="pointer-events-none absolute right-2.5 text-icon"
              />
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              color="neutral"
              variant="outlined"
              size="sm"
              type="button"
              onClick={onClose}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              color="accent"
              size="sm"
              type="submit"
              disabled={isCreating}
            >
              {t('inviteCreateModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default InviteCreateModal;
