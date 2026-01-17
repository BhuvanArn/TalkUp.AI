import ForgotPasswordPage from '@/components/organisms/forgot-password-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});
