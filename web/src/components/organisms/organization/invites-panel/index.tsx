import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { useLocale } from '@/hooks/i18n/useLocale';
import type { OrganizationInvite } from '@/services/organization/types';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import InviteCreateModal from '../invite-create-modal';
import { ROLE_META } from '../role-meta';

const STATUS_STYLES: Record<OrganizationInvite['status'], string> = {
  pending: 'bg-accent-weaker text-accent',
  accepted: 'bg-success/10 text-success',
  revoked: 'bg-error/10 text-error',
  expired: 'bg-surface text-text-weaker',
};

/**
 * F13: generate/list/revoke invite codes. Employees may generate `user`
 * invites and read the list; revoking is admin-only (backend-enforced too).
 * The invites list mirrors the members table; creating an invite happens in a
 * modal so the table can use the full page width.
 */
export const InvitesPanel = ({
  invites,
  isAdmin,
  callerRole,
  onCreate,
  onRevoke,
  isCreating,
}: {
  invites: OrganizationInvite[];
  isAdmin: boolean;
  callerRole: string | null;
  onCreate: (body: {
    email?: string;
    role: 'user' | 'employee';
  }) => Promise<void>;
  onRevoke: (inviteId: string) => void;
  isCreating: boolean;
}) => {
  const { t } = useTranslation('settings');
  const { intlLocale } = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canInvite = callerRole === 'admin' || callerRole === 'employee';

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('invitesPanel.codeCopied'));
    } catch {
      toast.error(t('invitesPanel.copyError'));
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-h4 text-text">{t('invitesPanel.title')}</h3>
        {canInvite && (
          <Button color="accent" size="sm" onClick={() => setIsModalOpen(true)}>
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="plus" size="sm" />
              {t('invitesPanel.create')}
            </span>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full border-collapse text-left text-body-s">
          <thead>
            <tr className="border-b border-border bg-surface text-label-s uppercase tracking-wide text-text-weaker">
              <th className="px-4 py-3 font-medium">
                {t('invitesPanel.columns.code')}
              </th>
              <th className="px-4 py-3 font-medium">
                {t('invitesPanel.columns.role')}
              </th>
              <th className="px-4 py-3 font-medium">
                {t('invitesPanel.columns.status')}
              </th>
              <th className="px-4 py-3 font-medium">
                {t('invitesPanel.columns.email')}
              </th>
              <th className="px-4 py-3 font-medium">
                {t('invitesPanel.columns.expires')}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t('invitesPanel.columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr
                key={invite.invite_id}
                className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  <code className="font-mono text-text">{invite.code}</code>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-body-s font-medium capitalize',
                      ROLE_META[invite.role].badge,
                    )}
                  >
                    <Icon icon={ROLE_META[invite.role].icon} size="sm" />
                    {t(`organization.roleNames.${invite.role}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-label-m capitalize',
                      STATUS_STYLES[invite.status],
                    )}
                  >
                    {t(`invitesPanel.statuses.${invite.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-weak">
                  {invite.email ?? t('invitesPanel.anyEmail')}
                </td>
                <td className="px-4 py-3 text-text-weak">
                  {new Date(invite.expires_at).toLocaleDateString(intlLocale)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      color="accent"
                      variant="outlined"
                      size="sm"
                      onClick={() => copyCode(invite.code)}
                    >
                      {t('invitesPanel.copyCode')}
                    </Button>
                    {isAdmin && invite.status === 'pending' && (
                      <Button
                        color="error"
                        variant="outlined"
                        size="sm"
                        onClick={() => onRevoke(invite.invite_id)}
                      >
                        {t('invitesPanel.revoke')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {invites.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-text-weaker"
                >
                  {t('invitesPanel.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canInvite && (
        <InviteCreateModal
          isOpen={isModalOpen}
          isAdmin={isAdmin}
          isCreating={isCreating}
          onCreate={onCreate}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
};

export default InvitesPanel;
