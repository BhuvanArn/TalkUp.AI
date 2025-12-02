import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/integrations')({
  beforeLoad: createAuthGuard('/settings/integrations'),
  component: SettingsIntegrations,
});

/**
 * Integrations settings page
 *
 * Allows users to manage their third-party integrations.
 */
function SettingsIntegrations() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Integrations</h2>
      </div>
    </div>
  );
}
