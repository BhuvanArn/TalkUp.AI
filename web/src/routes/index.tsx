import LandingPage from '@/components/organisms/landing-page';
import { APP_HOME } from '@/config/routes.config';
import { createAuthRedirectGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: createAuthRedirectGuard(APP_HOME),
  component: LandingPage,
});
