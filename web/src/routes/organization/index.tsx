import { createAuthGuard } from '@/utils/auth.guards';
import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organization/')({
  beforeLoad: createAuthGuard('/organization/'),
  component: OrganizationIndex,
});

/**
 * Organization index: redirects to the Members sub-route by default.
 */
function OrganizationIndex() {
  return <Navigate to="/organization/members" />;
}
