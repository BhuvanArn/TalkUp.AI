import ForgotPasswordForm from '@/components/molecules/auth/forgot-password-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
});

function ForgotPassword() {
  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <div className="flex flex-col items-center w-full pt-30 px-4">
        <ForgotPasswordForm />
      </div>
      <ConvincingBanner />
    </div>
  );
}
