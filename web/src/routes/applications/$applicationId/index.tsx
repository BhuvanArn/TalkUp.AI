import { createAuthGuard } from '@/utils/auth.guards';
import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/applications/$applicationId/')({
  beforeLoad: createAuthGuard('/applications/$applicationId/'),
  component: ApplicationIndex,
});

/**
 * Application detail index page
 *
 * Redirects to the dashboard by default when visiting an application.
 */
function ApplicationIndex() {
  const { applicationId } = Route.useParams();

  // Redirect to dashboard by default
  return <Navigate to={`/applications/${applicationId}/dashboard`} />;
}
