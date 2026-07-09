import { Button } from '@/components/atoms/button';
import type {
  OrgMemberRole,
  OrganizationMember,
} from '@/services/organization/types';
import { useState } from 'react';

type RoleFilter = 'all' | 'employee' | 'user';

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : '—';

/**
 * F13/F14: members list with per-user interview stats. Employees get the
 * read-only monitoring view; admins add a role filter + manage actions.
 */
export const MembersTable = ({
  members,
  isAdmin,
  selectedUserId,
  onSelect,
  onChangeRole,
  onRemove,
}: {
  members: OrganizationMember[];
  isAdmin: boolean;
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  onChangeRole: (userId: string, role: 'user' | 'employee') => void;
  onRemove: (userId: string) => void;
}) => {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const visible =
    isAdmin && roleFilter !== 'all'
      ? members.filter((m) => m.user_role === roleFilter)
      : members;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-h4 text-text">Members</h3>
        {isAdmin && (
          <label className="flex items-center gap-2 text-body-s text-text-weaker">
            Filter by role
            <select
              aria-label="Filter by role"
              className="rounded border border-border bg-surface px-2 py-1 text-body-s text-text"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="all">All</option>
              <option value="employee">Employees only</option>
              <option value="user">Users only</option>
            </select>
          </label>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-body-s">
          <thead className="bg-surface text-text-weaker">
            <tr>
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Interviews</th>
              <th className="px-4 py-2">Completed</th>
              <th className="px-4 py-2">Avg score</th>
              <th className="px-4 py-2">Last activity</th>
              {isAdmin && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr
                key={m.user_id}
                onClick={() => onSelect(m.user_id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(m.user_id);
                  }
                }}
                aria-selected={selectedUserId === m.user_id}
                className={`cursor-pointer border-t border-border hover:bg-surface ${
                  selectedUserId === m.user_id ? 'bg-accent-weaker' : ''
                }`}
              >
                <td className="px-4 py-2 text-text">{m.username}</td>
                <td className="px-4 py-2 text-text-weak">{m.user_role}</td>
                <td className="px-4 py-2">{m.interviewCount}</td>
                <td className="px-4 py-2">{m.completedCount}</td>
                <td className="px-4 py-2">{m.avgScore ?? '—'}</td>
                <td className="px-4 py-2">{formatDate(m.lastActivityAt)}</td>
                {isAdmin && (
                  <td className="px-4 py-2">
                    {m.user_role !== 'admin' && (
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Role for ${m.username}`}
                          className="rounded border border-border bg-surface px-2 py-1"
                          value={m.user_role as Exclude<OrgMemberRole, 'admin'>}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            onChangeRole(
                              m.user_id,
                              e.target.value as 'user' | 'employee',
                            );
                          }}
                        >
                          <option value="user">user</option>
                          <option value="employee">employee</option>
                        </select>
                        <Button
                          color="accent"
                          variant="outlined"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(m.user_id);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 6}
                  className="px-4 py-6 text-center text-text-weaker"
                >
                  No members match this filter yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MembersTable;
