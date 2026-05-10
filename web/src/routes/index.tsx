import LandingPage from '@/components/organisms/landing-page';
import { createAuthRedirectGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: createAuthRedirectGuard('/simulations'),
  component: LandingPage,
});
