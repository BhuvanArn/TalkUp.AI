import { ROLE_META } from '@/components/organisms/organization/role-meta';
import type { OrgMemberRole } from '@/services/organization/types';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

interface MemberRow {
  name: string;
  /** Only the roles the example shows, each with a `membersMock.roles` label. */
  role: Exclude<OrgMemberRole, 'admin'>;
  interviews: number;
  completed: number;
  avgScore: number | null;
  lastActivityKey: ParseKeys<'landing'>;
}

const MEMBERS: MemberRow[] = [
  {
    name: 'Léa M.',
    role: 'user',
    interviews: 6,
    completed: 5,
    avgScore: 78,
    lastActivityKey: 'membersMock.lastActivity.today',
  },
  {
    name: 'Yanis B.',
    role: 'user',
    interviews: 3,
    completed: 3,
    avgScore: 64,
    lastActivityKey: 'membersMock.lastActivity.yesterday',
  },
  {
    name: 'Chloé D.',
    role: 'user',
    interviews: 1,
    completed: 0,
    avgScore: null,
    lastActivityKey: 'membersMock.lastActivity.oct12',
  },
  {
    name: 'M. Laurent',
    role: 'employee',
    interviews: 0,
    completed: 0,
    avgScore: null,
    lastActivityKey: 'membersMock.lastActivity.oct17',
  },
];

const HEADERS = [
  'membersMock.headers.member',
  'membersMock.headers.role',
  'membersMock.headers.interviews',
  'membersMock.headers.completed',
  'membersMock.headers.avgScore',
  'membersMock.headers.lastActivity',
] as const satisfies readonly ParseKeys<'landing'>[];

const CELL = 'whitespace-nowrap border-b border-border px-3.5 py-[11px]';

/**
 * Example organization members table, mirroring the org dashboard. The real
 * `MembersTable` needs live members and admin actions, so only its role
 * vocabulary and pill colors (`ROLE_META`) are shared here.
 */
const MembersTableMock = () => {
  const { t } = useTranslation('landing');
  return (
    // Scrolls sideways on phones: focusable so keyboard users can scroll it too.
    <div
      role="region"
      aria-label={t('membersMock.regionLabel')}
      tabIndex={0}
      className="relative min-w-0 overflow-x-auto rounded-2xl border border-border bg-background focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <table
        aria-label={t('membersMock.tableLabel')}
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
                {t(header)}
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
                  {t(`membersMock.roles.${member.role}`)}
                </span>
              </td>
              <td className={CELL}>{member.interviews}</td>
              <td className={CELL}>{member.completed}</td>
              <td className={CELL}>
                {member.avgScore ?? (
                  <>
                    <span aria-hidden="true">–</span>
                    <span className="sr-only">{t('membersMock.noScore')}</span>
                  </>
                )}
              </td>
              <td className={CELL}>{t(member.lastActivityKey)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MembersTableMock;
