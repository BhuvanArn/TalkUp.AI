import AuthPageShell from '@/components/molecules/auth-page-shell';
import ResetPasswordForm from '@/components/molecules/auth/reset-password-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { email } = Route.useSearch();

  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <ResetPasswordForm initialEmail={email} />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
