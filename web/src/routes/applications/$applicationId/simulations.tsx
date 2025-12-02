import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/applications/$applicationId/simulations',
)({
  beforeLoad: createAuthGuard('/applications/$applicationId/simulations'),
  component: ApplicationSimulations,
});

/**
 * Application-specific simulations page
 *
 * Shows simulations related to this specific job application.
 */
function ApplicationSimulations() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Simulations</h2>
      </div>
    </div>
  );
}
