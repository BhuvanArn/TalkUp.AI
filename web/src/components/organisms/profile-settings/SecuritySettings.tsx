import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Toggle } from '@/components/atoms/toggle';
import { ConfirmModal } from '@/components/molecules/confirm-modal';
import { cn } from '@/utils/cn';
import { Laptop, Smartphone } from 'lucide-react';
import { useState } from 'react';

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
  sessions: AccountSession[];
  onRevokeSession: (sessionId: string) => void;
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
  sessions,
  onRevokeSession,
  emailOnNewDevice,
  onEmailOnNewDeviceChange,
  onLogoutEverywhere,
  onChangePassword,
  onRequestDataExport,
  onDeleteAccount,
}: SecuritySettingsProps) {
  const [localEmailOnNewDevice, setLocalEmailOnNewDevice] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutEverywhereOpen, setLogoutEverywhereOpen] = useState(false);
  const emailOnNewDeviceEnabled = emailOnNewDevice ?? localEmailOnNewDevice;

  const otherSessionCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <h3 className="mb-1 text-base font-bold text-text">Password</h3>
        <p className="mb-4 text-sm text-text-weaker">
          Use a unique password for TalkUp. If you reuse a password from another
          service, change it here after any breach elsewhere.
        </p>
        <Button
          type="button"
          variant="outlined"
          color="neutral"
          size="md"
          onClick={onChangePassword}
        >
          Change password
        </Button>
      </section>

      <section className={cardClass}>
        <h3 className="mb-1 text-base font-bold text-text">
          Sign-in notifications
        </h3>
        <p className="mb-3 text-sm text-text-weaker">
          Get an email when a new device or browser signs in to your account.
        </p>
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="security-email-new-device"
            className="cursor-pointer text-sm text-text"
          >
            Email me when a new device is used
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
            aria-label="Email me when a new device is used"
          />
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="mb-1 text-base font-bold text-text">
          Devices & sessions
        </h3>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="min-w-0 flex-1 text-sm text-text-weaker">
            These sessions can use your account. Revoke any you do not
            recognize.
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
                  ? 'No other devices to sign out'
                  : undefined
              }
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setLogoutEverywhereOpen(true)}
            >
              Log out everywhere
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
                        This device
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
                  onClick={() => onRevokeSession(s.id)}
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {onRequestDataExport && (
        <section className={cardClass}>
          <h3 className="mb-1 text-base font-bold text-text">Your data</h3>
          <p className="mb-4 text-sm text-text-weaker">
            Download a copy of the profile and activity data we store for your
            account (subject to product limits).
          </p>
          <Button
            type="button"
            variant="outlined"
            color="neutral"
            size="md"
            onClick={onRequestDataExport}
          >
            Request a copy of my data
          </Button>
        </section>
      )}

      <section
        className={cn(
          'rounded-xl border-2 border-error/35 bg-error-weaker/40 px-5 py-5 md:px-6 dark:bg-error-weaker/20',
        )}
      >
        <h3 className="mb-1 text-base font-bold text-error">Danger zone</h3>
        <p className="mb-4 text-sm text-text-weaker">
          Deleting your account removes your profile, preferences, and access to
          TalkUp. This cannot be undone.
        </p>
        <Button
          type="button"
          variant="contained"
          color="error"
          size="md"
          onClick={() => setDeleteModalOpen(true)}
        >
          Delete my account
        </Button>
      </section>

      <ConfirmModal
        isOpen={logoutEverywhereOpen}
        title="Log out of other devices?"
        message="You will be signed out everywhere except on this browser. Other devices will need to sign in again."
        confirmLabel="Sign out other devices"
        cancelLabel="Cancel"
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
        title="Delete your account?"
        message="You will lose access to TalkUp and your data will be scheduled for deletion according to our retention policy. This action cannot be undone."
        confirmLabel="Delete account"
        cancelLabel="Cancel"
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
