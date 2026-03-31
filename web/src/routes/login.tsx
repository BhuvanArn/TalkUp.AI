import LoginForm from '@/components/molecules/auth/login-form';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { createPublicRouteGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  beforeLoad: createPublicRouteGuard('/login'),
  component: Login,
});

function Login() {
  return (
    <div className="grid grid-cols-[1fr_512px] min-h-screen">
      <div className="flex flex-col items-center w-full pt-30 px-4">
        <LoginForm />
      </div>
      <ConvincingBanner />
    </div>
  );
}
