import { Avatar } from '@/components/atoms/avatar';
import { useLocale } from '@/hooks/i18n/useLocale';
import {
  useGetMemberDetail,
  useGetMyOrganization,
} from '@/hooks/organization/useServices';
import type { OrgMemberRole } from '@/services/organization/types';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

const EMPTY = '—';

/** Up to two initials from the org name, e.g. "Acme Corporation" -> "AC". */
const orgInitials = (name: string) =>
  name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

/** Translation key of the human label for the caller's org role. */
const ROLE_LABEL_KEYS = {
  admin: 'organizationSettings.roles.admin',
  employee: 'organizationSettings.roles.employee',
  user: 'organizationSettings.roles.user',
} as const satisfies Record<OrgMemberRole, ParseKeys<'settings'>>;

const roleLabelKey = (role: string | null | undefined) => {
  if (role === 'admin' || role === 'employee' || role === 'user') {
    return ROLE_LABEL_KEYS[role];
  }
  return ROLE_LABEL_KEYS.user;
};

const formatDateTime = (iso: string | null | undefined, intlLocale: string) =>
  iso ? new Date(iso).toLocaleString(intlLocale) : EMPTY;

/**
 * @interface OrganizationSettingsProps
 * @description Configuration for the Organization panel in profile settings.
 */
interface OrganizationSettingsProps {
  /** The caller's organization id (from useAuthStatus). */
  organizationId: string;
  /** The caller's own user id (from the profile fetch). */
  userId: string | null;
  /** The caller's org role (from useAuthStatus). */
  userRole: string | null;
}

/**
 * OrganizationSettings Component
 *
 * Renders the caller's own organization affiliation on the normal profile
 * surface (not the emerald org-view chrome): org avatar + name, the caller's
 * role label, and their personal F14 activity stats. Visible to every
 * org-affiliated account (admin / employee / user) — the visibility gate lives
 * in the profile route and is role-agnostic.
 *
 * @param {OrganizationSettingsProps} props - Component properties.
 * @returns {JSX.Element} The rendered organization panel.
 */
export function OrganizationSettings({
  organizationId,
  userId,
  userRole,
}: OrganizationSettingsProps) {
  const { t } = useTranslation('settings');
  const { intlLocale } = useLocale();
  const orgQuery = useGetMyOrganization();
  const memberQuery = useGetMemberDetail(organizationId, userId);

  const org = orgQuery.data;
  const stats = memberQuery.data?.stats;

  if (orgQuery.isPending) {
    return (
      <p className="text-body-m text-text-weaker" data-testid="org-loading">
        {t('organizationSettings.loading')}
      </p>
    );
  }

  if (orgQuery.isError || !org) {
    return (
      <p className="text-body-s text-error" data-testid="org-error">
        {t('organizationSettings.loadError')}
      </p>
    );
  }

  // The stats endpoint may error (e.g. backend still 403s a plain user) or be
  // pending — degrade to zeros / friendly copy rather than blocking the panel.
  const interviewCount = stats?.interviewCount ?? 0;
  const completedCount = stats?.completedCount ?? 0;
  const avgScore = stats?.avgScore ?? null;
  const lastActivityAt = stats?.lastActivityAt ?? null;

  return (
    <div className="flex flex-col gap-8" data-testid="organization-settings">
      <div className="flex flex-col gap-5">
        <h3 className="mb-1 border-b border-border pb-2 text-base font-bold text-text">
          {t('organizationSettings.title')}
        </h3>

        <div className="flex items-center gap-4">
          <Avatar
            data-testid="org-avatar"
            src={org.profile_picture ?? undefined}
            alt={t('organization.logoAlt', { name: org.organization_name })}
            fallback={orgInitials(org.organization_name)}
            size="lg"
            className="shrink-0 border border-border bg-accent-weak text-accent"
          />
          <div className="flex min-w-0 flex-col">
            <span className="text-label-s text-accent">
              {t('organization.label')}
            </span>
            <span className="truncate text-h4 text-text">
              {org.organization_name}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-label-m text-idle">
            {t('organizationSettings.yourRole')}
          </span>
          <span
            className="text-sm font-semibold text-text"
            data-testid="org-role-label"
          >
            {t(roleLabelKey(userRole))}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="mb-1 border-b border-border pb-2 text-base font-bold text-text">
          {t('organizationSettings.activity.title')}
        </h3>

        {memberQuery.isError ? (
          <p
            className="text-body-s text-text-weaker"
            data-testid="org-stats-unavailable"
          >
            {t('organizationSettings.activity.unavailable')}
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-4 text-body-s sm:grid-cols-4">
            <div>
              <dt className="text-text-weaker">
                {t('organization.stats.interviews')}
              </dt>
              <dd className="text-h5 text-text" data-testid="stat-interviews">
                {interviewCount}
              </dd>
            </div>
            <div>
              <dt className="text-text-weaker">
                {t('organization.stats.completed')}
              </dt>
              <dd className="text-h5 text-text" data-testid="stat-completed">
                {completedCount}
              </dd>
            </div>
            <div>
              <dt className="text-text-weaker">
                {t('organization.stats.avgScore')}
              </dt>
              <dd className="text-h5 text-text" data-testid="stat-avg-score">
                {avgScore !== null
                  ? new Intl.NumberFormat(intlLocale).format(avgScore)
                  : EMPTY}
              </dd>
            </div>
            <div>
              <dt className="text-text-weaker">
                {t('organization.stats.lastActivity')}
              </dt>
              <dd
                className="text-h5 text-text"
                data-testid="stat-last-activity"
              >
                {formatDateTime(lastActivityAt, intlLocale)}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

export default OrganizationSettings;
