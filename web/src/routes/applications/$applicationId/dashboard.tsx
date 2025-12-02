import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/applications/$applicationId/dashboard')({
  beforeLoad: createAuthGuard('/applications/$applicationId/dashboard'),
  component: ApplicationDashboard,
});

/**
 * Application dashboard/overview page
 *
 * Shows an overview and quick access to all application sections.
 */
function ApplicationDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Dashboard</h2>
      </div>
    </div>
  );
}
