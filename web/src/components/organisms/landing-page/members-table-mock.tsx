import { ROLE_META } from '@/components/organisms/organization/role-meta';
import type { OrgMemberRole } from '@/services/organization/types';

interface MemberRow {
  name: string;
  role: OrgMemberRole;
  interviews: number;
  completed: number;
  avgScore: number | null;
  lastActivity: string;
}

const MEMBERS: MemberRow[] = [
  {
    name: 'Léa M.',
    role: 'user',
    interviews: 6,
    completed: 5,
    avgScore: 78,
    lastActivity: 'Today',
  },
  {
    name: 'Yanis B.',
    role: 'user',
    interviews: 3,
    completed: 3,
    avgScore: 64,
    lastActivity: 'Yesterday',
  },
  {
    name: 'Chloé D.',
    role: 'user',
    interviews: 1,
    completed: 0,
    avgScore: null,
    lastActivity: 'Oct 12',
  },
  {
    name: 'M. Laurent',
    role: 'employee',
    interviews: 0,
    completed: 0,
    avgScore: null,
    lastActivity: 'Oct 17',
  },
];

const HEADERS = [
  'Member',
  'Role',
  'Interviews',
  'Completed',
  'Avg score',
  'Last activity',
];

const CELL = 'whitespace-nowrap border-b border-border px-3.5 py-[11px]';

/**
 * Example organization members table, mirroring the org dashboard. The real
 * `MembersTable` needs live members and admin actions, so only its role
 * vocabulary and pill colors (`ROLE_META`) are shared here.
 */
const MembersTableMock = () => (
  <div className="relative min-w-0 overflow-x-auto rounded-2xl border border-border bg-background">
    <table
      aria-label="Example members table"
      className="w-full min-w-[520px] border-collapse text-left text-[13px] tabular-nums text-text"
    >
      <thead>
        <tr>
          {HEADERS.map((header) => (
            <th
              key={header}
              scope="col"
              className={`${CELL} bg-surface font-medium text-text-weaker`}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="[&>tr:last-child>td]:border-b-0">
        {MEMBERS.map((member) => (
          <tr key={member.name}>
            <td className={CELL}>{member.name}</td>
            <td className={CELL}>
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] capitalize ${ROLE_META[member.role].badge}`}
              >
                {member.role}
              </span>
            </td>
            <td className={CELL}>{member.interviews}</td>
            <td className={CELL}>{member.completed}</td>
            <td className={CELL}>
              {member.avgScore ?? (
                <>
                  <span aria-hidden="true">–</span>
                  <span className="sr-only">No score yet</span>
                </>
              )}
            </td>
            <td className={CELL}>{member.lastActivity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MembersTableMock;
