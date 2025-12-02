import LoginForm from '@/components/molecules/auth/login-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  return (
    <div className="flex flex-col items-center w-full gap-4 p-2">
      <LoginForm />
    </div>
  );
}
