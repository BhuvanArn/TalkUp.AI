import AuthPageShell from '@/components/molecules/auth-page-shell';
import RegisterForm from '@/components/molecules/auth/register-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createPublicRouteGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/register')({
  beforeLoad: createPublicRouteGuard('/register'),
  component: Register,
});

function Register() {
  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <RegisterForm />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
