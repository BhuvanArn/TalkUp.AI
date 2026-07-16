import AuthPageShell from '@/components/molecules/auth-page-shell';
import RegisterForm from '@/components/molecules/auth/register-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createPublicRouteGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === 'string' ? search.code : '',
  }),
  beforeLoad: createPublicRouteGuard('/register'),
  component: Register,
});

function Register() {
  const { code } = Route.useSearch();

  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <RegisterForm initialCode={code} />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
