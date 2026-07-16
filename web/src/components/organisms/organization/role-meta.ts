import type { IconName } from '@/components/atoms/icon/icon-map';
import type { OrgMemberRole } from '@/services/organization/types';

/**
 * Per-role presentation shared across the organization UI (members table,
 * invites). Keeps the icon + pill styling consistent everywhere a role appears.
 */
export const ROLE_META: Record<
  OrgMemberRole,
  { icon: IconName; badge: string }
> = {
  admin: { icon: 'security', badge: 'bg-accent-weak text-accent' },
  employee: { icon: 'members', badge: 'bg-surface-raised text-text-weak' },
  user: { icon: 'profile', badge: 'bg-surface text-text-weaker' },
};
