import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import type { OrganizationInvite } from '@/services/organization/types';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import toast from 'react-hot-toast';

import InviteCreateModal from '../invite-create-modal';
import { ROLE_META } from '../role-meta';

const STATUS_STYLES: Record<OrganizationInvite['status'], string> = {
  pending: 'bg-accent-weaker text-accent',
  accepted: 'bg-success/10 text-success',
  revoked: 'bg-error/10 text-error',
  expired: 'bg-surface text-text-weaker',
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

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
  onCreate: (body: { email?: string; role: 'user' | 'employee' }) => void;
  onRevoke: (inviteId: string) => void;
  isCreating: boolean;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canInvite = callerRole === 'admin' || callerRole === 'employee';

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied');
    } catch {
      toast.error('Could not copy the code');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-h4 text-text">Invites</h3>
        {canInvite && (
          <Button color="accent" size="sm" onClick={() => setIsModalOpen(true)}>
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="plus" size="sm" />
              Create invite
            </span>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full border-collapse text-left text-body-s">
          <thead>
            <tr className="border-b border-border bg-surface text-label-s uppercase tracking-wide text-text-weaker">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
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
                    {invite.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-label-m capitalize',
                      STATUS_STYLES[invite.status],
                    )}
                  >
                    {invite.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-weak">
                  {invite.email ?? 'any email'}
                </td>
                <td className="px-4 py-3 text-text-weak">
                  {formatDate(invite.expires_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      color="accent"
                      variant="outlined"
                      size="sm"
                      onClick={() => copyCode(invite.code)}
                    >
                      Copy code
                    </Button>
                    {isAdmin && invite.status === 'pending' && (
                      <Button
                        color="error"
                        variant="outlined"
                        size="sm"
                        onClick={() => onRevoke(invite.invite_id)}
                      >
                        Revoke
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
                  No invites yet. Create one to onboard members.
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
