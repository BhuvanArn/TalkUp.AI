import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Toggle } from '@/components/atoms/toggle';
import { ConfirmModal } from '@/components/molecules/confirm-modal';
import { cn } from '@/utils/cn';
import { Laptop, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** A browser or app session tied to the signed-in account (for display; API will replace mock data). */
export interface AccountSession {
  id: string;
  /** e.g. "Chrome 120 on Windows 11" */
  deviceLabel: string;
  /** City / region, if known */
  location?: string;
  /** Relative time or "Active now" */
  lastActive: string;
  /** The session for this browser tab */
  isCurrent: boolean;
  /** Hint for mobile vs desktop row icon */
  kind?: 'desktop' | 'mobile';
}

interface SecuritySettingsProps {
  /**
   * Active browser/app sessions. Currently unwired — mock data is hidden for
   * the demo (real sessions API tracked in
   * EpitechPromo2027/G-EIP-600-NAN-6-1-eip-tugdual.de-reviers#193). Pass a
   * non-empty list once the API exists to show the "Devices & sessions"
   * section. Defaults to empty, which hides the section.
   */
  sessions?: AccountSession[];
  onRevokeSession?: (sessionId: string) => void;
  /** Controlled sign-in email notification toggle */
  emailOnNewDevice?: boolean;
  onEmailOnNewDeviceChange?: (enabled: boolean) => void;
  /** Revoke every session except the current device (wire to API when available). */
  onLogoutEverywhere?: () => void;
  /** Wired later to auth / password flow */
  onChangePassword?: () => void;
  /** GDPR-style export; optional until backend exists */
  onRequestDataExport?: () => void;
  /** Called after the user confirms deletion in the modal */
  onDeleteAccount: () => void;
}

const cardClass =
  'rounded-xl border border-border bg-surface px-5 py-5 md:px-6';

/**
 * Security & account: password, sign-in alerts, active sessions, data export, delete account.
 */
export function SecuritySettings({
  sessions = [],
  onRevokeSession,
  emailOnNewDevice,
  onEmailOnNewDeviceChange,
  onLogoutEverywhere,
  onChangePassword,
  onRequestDataExport,
  onDeleteAccount,
}: SecuritySettingsProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [localEmailOnNewDevice, setLocalEmailOnNewDevice] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutEverywhereOpen, setLogoutEverywhereOpen] = useState(false);
  const emailOnNewDeviceEnabled = emailOnNewDevice ?? localEmailOnNewDevice;

  const otherSessionCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <h3 className="mb-1 text-base font-bold text-text">
          {t('securitySettings.password.title')}
        </h3>
        <p className="mb-4 text-sm text-text-weaker">
          {t('securitySettings.password.desc')}
        </p>
        <Button
          type="button"
          variant="outlined"
          color="neutral"
          size="md"
          onClick={onChangePassword}
        >
          {t('securitySettings.password.change')}
        </Button>
      </section>

      <section className={cardClass}>
        <h3 className="mb-1 text-base font-bold text-text">
          {t('securitySettings.signIn.title')}
        </h3>
        <p className="mb-3 text-sm text-text-weaker">
          {t('securitySettings.signIn.desc')}
        </p>
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="security-email-new-device"
            className="cursor-pointer text-sm text-text"
          >
            {t('securitySettings.signIn.emailOnNewDevice')}
          </label>
          <Toggle
            id="security-email-new-device"
            enabled={emailOnNewDeviceEnabled}
            onToggle={() => {
              const next = !emailOnNewDeviceEnabled;
              onEmailOnNewDeviceChange?.(next);
              if (emailOnNewDevice === undefined) {
                setLocalEmailOnNewDevice(next);
              }
            }}
            aria-label={t('securitySettings.signIn.emailOnNewDevice')}
          />
        </div>
      </section>

      {sessions.length > 0 && (
        <section className={cardClass}>
          <h3 className="mb-1 text-base font-bold text-text">
            {t('securitySettings.sessions.title')}
          </h3>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="min-w-0 flex-1 text-sm text-text-weaker">
              {t('securitySettings.sessions.desc')}
            </p>
            {onLogoutEverywhere && (
              <Button
                type="button"
                variant="outlined"
                color="neutral"
                size="sm"
                disabled={otherSessionCount === 0}
                title={
                  otherSessionCount === 0
                    ? t('securitySettings.sessions.noOtherDevices')
                    : undefined
                }
                className="w-full shrink-0 sm:w-auto"
                onClick={() => setLogoutEverywhereOpen(true)}
              >
                {t('securitySettings.sessions.logoutEverywhere')}
              </Button>
            )}
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-icon"
                    aria-hidden
                  >
                    {s.kind === 'mobile' ? (
                      <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                    ) : (
                      <Laptop className="h-5 w-5" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text">
                        {s.deviceLabel}
                      </span>
                      {s.isCurrent && (
                        <Badge color="success" className="!h-5 !min-h-0 !py-0">
                          {t('securitySettings.sessions.thisDevice')}
                        </Badge>
                      )}
                    </div>
                    {s.location && (
                      <div className="mt-0.5 text-xs text-text-weaker">
                        {s.location}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-text-weakest">
                      {s.lastActive}
                    </div>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    type="button"
                    variant="text"
                    color="error"
                    size="sm"
                    className="min-h-0 shrink-0 self-center py-1.5"
                    onClick={() => onRevokeSession?.(s.id)}
                  >
                    {t('securitySettings.sessions.revoke')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {onRequestDataExport && (
        <section className={cardClass}>
          <h3 className="mb-1 text-base font-bold text-text">
            {t('securitySettings.data.title')}
          </h3>
          <p className="mb-4 text-sm text-text-weaker">
            {t('securitySettings.data.desc')}
          </p>
          <Button
            type="button"
            variant="outlined"
            color="neutral"
            size="md"
            onClick={onRequestDataExport}
          >
            {t('securitySettings.data.request')}
          </Button>
        </section>
      )}

      <section
        className={cn(
          'rounded-xl border-2 border-error/35 bg-error-weaker/40 px-5 py-5 md:px-6 dark:bg-error-weaker/20',
        )}
      >
        <h3 className="mb-1 text-base font-bold text-error">
          {t('securitySettings.danger.title')}
        </h3>
        <p className="mb-4 text-sm text-text-weaker">
          {t('securitySettings.danger.desc')}
        </p>
        <Button
          type="button"
          variant="contained"
          color="error"
          size="md"
          onClick={() => setDeleteModalOpen(true)}
        >
          {t('securitySettings.danger.delete')}
        </Button>
      </section>

      <ConfirmModal
        isOpen={logoutEverywhereOpen}
        title={t('securitySettings.logoutModal.title')}
        message={t('securitySettings.logoutModal.message')}
        confirmLabel={t('securitySettings.logoutModal.confirm')}
        cancelLabel={t('common:actions.cancel')}
        confirmColor="accent"
        icon="warning"
        onConfirm={() => {
          setLogoutEverywhereOpen(false);
          onLogoutEverywhere?.();
        }}
        onCancel={() => setLogoutEverywhereOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        title={t('securitySettings.deleteModal.title')}
        message={t('securitySettings.deleteModal.message')}
        confirmLabel={t('securitySettings.deleteModal.confirm')}
        cancelLabel={t('common:actions.cancel')}
        confirmColor="error"
        icon="trash"
        onConfirm={() => {
          setDeleteModalOpen(false);
          onDeleteAccount();
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
