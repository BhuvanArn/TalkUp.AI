import AuthPageShell from '@/components/molecules/auth-page-shell';
import ForgotPasswordForm from '@/components/molecules/auth/forgot-password-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/forgot-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { email } = Route.useSearch();
  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <AuthPageShell>
        <ForgotPasswordForm initialEmail={email} />
      </AuthPageShell>
      <ConvincingBanner />
    </div>
  );
}
