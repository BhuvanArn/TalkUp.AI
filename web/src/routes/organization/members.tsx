import MemberDetail from '@/components/organisms/organization/member-detail';
import MembersTable from '@/components/organisms/organization/members-table';
import { OrgViewLayout } from '@/components/organisms/organization/org-view-layout';
import { useAuthStatus } from '@/hooks/auth/useServices';
import {
  useGetMemberDetail,
  useGetMyOrganization,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/hooks/organization/useServices';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/organization/members')({
  beforeLoad: createAuthGuard('/organization/members'),
  component: OrganizationMembersPage,
});

/**
 * Organization → Members: the members table takes the full width; selecting a
 * member ("View") opens their activity in a modal so the table layout does not
 * reserve a half-empty detail column when nothing is selected.
 */
function OrganizationMembersPage() {
  const { data: auth } = useAuthStatus();
  const { data: org } = useGetMyOrganization();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const orgId = org?.organization_id ?? '';
  const isAdmin = auth?.role === 'admin';

  const memberDetail = useGetMemberDetail(orgId, selectedUserId);
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);

  return (
    <OrgViewLayout>
      <MembersTable
        members={org?.members ?? []}
        isAdmin={isAdmin}
        selectedUserId={selectedUserId}
        onSelect={setSelectedUserId}
        onChangeRole={(userId, role) => updateRole.mutate({ userId, role })}
        onRemove={(userId) => removeMember.mutate(userId)}
      />
      <MemberDetail
        isOpen={!!selectedUserId}
        detail={memberDetail.data}
        isLoading={memberDetail.isLoading && !!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </OrgViewLayout>
  );
}
