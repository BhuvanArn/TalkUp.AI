import MemberDetail from '@/components/organisms/organization/member-detail';
import MembersTable from '@/components/organisms/organization/members-table';
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

export const Route = createFileRoute('/organization')({
  beforeLoad: createAuthGuard('/organization'),
  component: OrganizationPage,
});

function OrganizationPage() {
  const { data: auth } = useAuthStatus();
  const { data: org, isLoading } = useGetMyOrganization();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const orgId = org?.organization_id ?? '';
  const isAdmin = auth?.role === 'admin';

  const memberDetail = useGetMemberDetail(orgId, selectedUserId);
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-body-m text-text-weaker">Loading organization…</p>
      </main>
    );
  }

  if (!org) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-body-m text-text-weaker">
          You are not affiliated with an organization.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <h2 className="text-h2 text-text">{org.organization_name}</h2>
      </header>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MembersTable
          members={org.members ?? []}
          isAdmin={isAdmin}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
          onChangeRole={(userId, role) => updateRole.mutate({ userId, role })}
          onRemove={(userId) => removeMember.mutate(userId)}
        />
        <MemberDetail
          detail={memberDetail.data}
          isLoading={memberDetail.isLoading && !!selectedUserId}
        />
      </div>
    </main>
  );
}
