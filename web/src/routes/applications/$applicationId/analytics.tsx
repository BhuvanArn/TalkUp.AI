import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/applications/$applicationId/analytics')({
  beforeLoad: createAuthGuard('/applications/$applicationId/analytics'),
  component: ApplicationAnalytics,
});

/**
 * Application-specific analytics page
 *
 * Shows analytics and performance metrics for this specific job application.
 */
function ApplicationAnalytics() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Analytics</h2>
      </div>
    </div>
  );
}
