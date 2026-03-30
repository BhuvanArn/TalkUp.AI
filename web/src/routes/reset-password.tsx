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
      <div className="flex flex-col items-center w-full pt-30 px-4">
        <ResetPasswordForm initialEmail={email} />
      </div>
      <ConvincingBanner />
    </div>
  );
}
