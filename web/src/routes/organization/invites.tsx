import InvitesPanel from '@/components/organisms/organization/invites-panel';
import { OrgViewLayout } from '@/components/organisms/organization/org-view-layout';
import { useAuthStatus } from '@/hooks/auth/useServices';
import {
  useCreateInvite,
  useGetInvites,
  useGetMyOrganization,
  useRevokeInvite,
} from '@/hooks/organization/useServices';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organization/invites')({
  beforeLoad: createAuthGuard('/organization/invites'),
  component: OrganizationInvitesPage,
});

/**
 * Organization → Invites: create / list / revoke invite codes. RBAC is
 * unchanged from the former single page — employees may invite "user" only and
 * cannot revoke; admins have full control (enforced in InvitesPanel + server).
 */
function OrganizationInvitesPage() {
  const { data: auth } = useAuthStatus();
  const { data: org } = useGetMyOrganization();

  const orgId = org?.organization_id ?? '';
  const isAdmin = auth?.role === 'admin';
  const canSeeInvites = auth?.role === 'admin' || auth?.role === 'employee';

  const invites = useGetInvites(orgId, canSeeInvites);
  const createInvite = useCreateInvite(orgId);
  const revokeInvite = useRevokeInvite(orgId);

  return (
    <OrgViewLayout>
      <InvitesPanel
        invites={invites.data ?? []}
        isAdmin={isAdmin}
        callerRole={auth?.role ?? null}
        onCreate={(body) =>
          createInvite.mutateAsync(body).then(() => undefined)
        }
        onRevoke={(inviteId) => revokeInvite.mutate(inviteId)}
        isCreating={createInvite.isPending}
      />
    </OrgViewLayout>
  );
}
