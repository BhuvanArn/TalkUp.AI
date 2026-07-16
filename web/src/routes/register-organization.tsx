import AuthPageShell from '@/components/molecules/auth-page-shell';
import RegisterOrganizationForm from '@/components/molecules/auth/register-organization-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createPublicRouteGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/register-organization')({
  beforeLoad: createPublicRouteGuard('/register-organization'),
  component: RegisterOrganization,
});

function RegisterOrganization() {
  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <RegisterOrganizationForm />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
