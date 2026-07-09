import { Button } from '@/components/atoms/button';
import type { OrganizationInvite } from '@/services/organization/types';
import { useState } from 'react';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<OrganizationInvite['status'], string> = {
  pending: 'bg-accent-weaker text-accent',
  accepted: 'bg-success/10 text-success',
  revoked: 'bg-error/10 text-error',
  expired: 'bg-surface text-text-weaker',
};

/**
 * F13: generate/list/revoke invite codes. Employees may generate `user`
 * invites and read the list; revoking is admin-only (backend-enforced too).
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
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'employee'>('user');

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
    <section className="flex flex-col gap-3">
      <h3 className="text-h4 text-text">Invites</h3>
      {canInvite && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({ email: email.trim() || undefined, role });
            setEmail('');
          }}
        >
          <input
            type="email"
            aria-label="Invite email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="rounded border border-border bg-surface px-3 py-1.5 text-body-s text-text"
          />
          <label className="flex items-center gap-2 text-body-s text-text-weaker">
            Invite role
            <select
              aria-label="Invite role"
              className="rounded border border-border bg-surface px-2 py-1.5 text-body-s text-text"
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'employee')}
            >
              <option value="user">user</option>
              {isAdmin && <option value="employee">employee</option>}
            </select>
          </label>
          <Button color="accent" size="sm" type="submit" disabled={isCreating}>
            Generate invite
          </Button>
        </form>
      )}
      <ul className="flex flex-col gap-2">
        {invites.map((invite) => (
          <li
            key={invite.invite_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-body-s"
          >
            <div className="flex items-center gap-3">
              <code className="font-mono text-text">{invite.code}</code>
              <span
                className={`rounded-full px-2 py-0.5 text-label-m ${STATUS_STYLES[invite.status]}`}
              >
                {invite.status}
              </span>
              <span className="text-text-weaker">
                {invite.email ?? 'any email'} · {invite.role} · expires{' '}
                {new Date(invite.expires_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
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
          </li>
        ))}
        {invites.length === 0 && (
          <li className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-body-s text-text-weaker">
            No invites yet — generate one to onboard members.
          </li>
        )}
      </ul>
    </section>
  );
};

export default InvitesPanel;
