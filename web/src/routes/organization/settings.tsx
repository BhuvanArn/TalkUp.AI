import OrgSettings from '@/components/organisms/organization/org-settings';
import { OrgViewLayout } from '@/components/organisms/organization/org-view-layout';
import { useAuthStatus } from '@/hooks/auth/useServices';
import {
  useGetMyOrganization,
  useUpdateOrganization,
} from '@/hooks/organization/useServices';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organization/settings')({
  beforeLoad: createAuthGuard('/organization/settings'),
  component: OrganizationSettingsPage,
});

/**
 * Organization → Settings: rename / rebrand the org. Admin-only content, same
 * as the former single page (employees reach the route but see no editable
 * settings — the server rejects the mutation regardless).
 */
function OrganizationSettingsPage() {
  const { data: auth } = useAuthStatus();
  const { data: org } = useGetMyOrganization();

  const orgId = org?.organization_id ?? '';
  const isAdmin = auth?.role === 'admin';
  const updateOrganization = useUpdateOrganization(orgId);

  return (
    <OrgViewLayout>
      {isAdmin && org ? (
        <OrgSettings
          org={org}
          onSave={(body) => updateOrganization.mutate(body)}
          isSaving={updateOrganization.isPending}
        />
      ) : (
        <p className="text-body-m text-text-weaker">
          Only organization admins can edit organization settings.
        </p>
      )}
    </OrgViewLayout>
  );
}
