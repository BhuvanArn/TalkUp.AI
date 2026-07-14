import AuthPageShell from '@/components/molecules/auth-page-shell';
import OrganizationCreated from '@/components/molecules/auth/organization-created';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createPublicRouteGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organization-created')({
  validateSearch: (search: Record<string, unknown>) => ({
    organizationName:
      typeof search.organizationName === 'string'
        ? search.organizationName
        : '',
    email: typeof search.email === 'string' ? search.email : '',
  }),
  beforeLoad: createPublicRouteGuard('/organization-created'),
  component: OrganizationCreatedPage,
});

function OrganizationCreatedPage() {
  const { organizationName, email } = Route.useSearch();

  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <OrganizationCreated
          organizationName={organizationName}
          email={email}
        />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
