import AuthPageShell from '@/components/molecules/auth-page-shell';
import VerifyEmailForm from '@/components/molecules/auth/verify-email-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createPublicRouteGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    redirect:
      typeof search.redirect === 'string' && search.redirect.startsWith('/')
        ? search.redirect
        : '/',
  }),
  beforeLoad: createPublicRouteGuard('/verify-email'),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email, redirect } = Route.useSearch();

  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <VerifyEmailForm initialEmail={email} redirectTo={redirect} />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
