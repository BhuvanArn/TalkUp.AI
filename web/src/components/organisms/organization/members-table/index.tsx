import { Avatar } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import type {
  OrgMemberRole,
  OrganizationMember,
} from '@/services/organization/types';
import { cn } from '@/utils/cn';
import { useState } from 'react';

import { ROLE_META } from '../role-meta';

type RoleFilter = 'all' | 'employee' | 'user';

const EMPTY = '·';

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : EMPTY;

const initials = (username: string) =>
  username
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || username.charAt(0).toUpperCase();

/** Small role pill with an icon: admin highlighted, employee mid, user muted. */
const RoleBadge = ({ role }: { role: OrgMemberRole }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-body-s font-medium capitalize',
      ROLE_META[role].badge,
    )}
  >
    <Icon icon={ROLE_META[role].icon} size="sm" />
    {role}
  </span>
);

const thNum = 'px-4 py-3 text-center font-medium';
const tdNum = 'px-4 py-3 text-center tabular-nums text-text';

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
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-h4 text-text">Members</h3>
        {isAdmin && (
          <label className="flex items-center gap-2 text-body-s text-text-weaker">
            Filter by role
            <span className="relative inline-flex items-center">
              <select
                aria-label="Filter by role"
                className="cursor-pointer appearance-none rounded-lg border border-border bg-surface py-1.5 pl-3 pr-9 text-body-s text-text transition-colors hover:border-border-strong hover:bg-surface-hover focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              >
                <option value="all">All</option>
                <option value="employee">Employees only</option>
                <option value="user">Users only</option>
              </select>
              <Icon
                icon="caret-down"
                size="sm"
                className="pointer-events-none absolute right-2.5 text-icon"
              />
            </span>
          </label>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full border-collapse text-left text-body-s">
          <thead>
            <tr className="border-b border-border bg-surface text-label-s uppercase tracking-wide text-text-weaker">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className={thNum}>Interviews</th>
              <th className={thNum}>Completed</th>
              <th className={thNum}>Avg score</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => {
              const isSelected = selectedUserId === m.user_id;
              return (
                <tr
                  key={m.user_id}
                  className={cn(
                    'border-b border-border/70 transition-colors last:border-b-0 hover:bg-surface-hover',
                    isSelected && 'bg-accent-weaker hover:bg-accent-weaker',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        alt=""
                        fallback={initials(m.username)}
                        size="sm"
                        className="!h-8 !w-8 shrink-0 border border-border bg-accent font-semibold text-white"
                      />
                      <span className="truncate font-medium text-text">
                        {m.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.user_role} />
                  </td>
                  <td className={tdNum}>{m.interviewCount}</td>
                  <td className={tdNum}>{m.completedCount}</td>
                  <td className={tdNum}>{m.avgScore ?? EMPTY}</td>
                  <td className="px-4 py-3 text-text-weak">
                    {formatDate(m.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && m.user_role !== 'admin' && (
                        <>
                          <select
                            aria-label={`Role for ${m.username}`}
                            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-body-s text-text focus:border-accent focus:outline-none"
                            value={
                              m.user_role as Exclude<OrgMemberRole, 'admin'>
                            }
                            onChange={(e) =>
                              onChangeRole(
                                m.user_id,
                                e.target.value as 'user' | 'employee',
                              )
                            }
                          >
                            <option value="user">user</option>
                            <option value="employee">employee</option>
                          </select>
                          <Button
                            color="error"
                            variant="text"
                            size="sm"
                            onClick={() => onRemove(m.user_id)}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                      <Button
                        color="accent"
                        variant={isSelected ? 'contained' : 'outlined'}
                        size="sm"
                        aria-pressed={isSelected}
                        onClick={() => onSelect(m.user_id)}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-text-weaker"
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
