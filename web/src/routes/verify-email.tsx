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
      <div className="flex flex-col items-center w-full pt-30 px-4">
        <VerifyEmailForm initialEmail={email} redirectTo={redirect} />
      </div>
      <ConvincingBanner />
    </div>
  );
}
