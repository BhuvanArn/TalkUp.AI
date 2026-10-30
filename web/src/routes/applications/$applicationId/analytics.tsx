import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('app');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">
          {t('applications.analyticsTitle')}
        </h2>
      </div>
    </div>
  );
}
