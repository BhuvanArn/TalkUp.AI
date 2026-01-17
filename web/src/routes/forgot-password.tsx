import { createFileRoute } from '@tanstack/react-router';
import ForgotPasswordPage from '@/components/organisms/forgot-password-page';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});