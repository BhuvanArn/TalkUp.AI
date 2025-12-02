import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/security')({
  beforeLoad: createAuthGuard('/settings/security'),
  component: SettingsSecurity,
});

/**
 * Security settings page
 *
 * Allows users to manage their security and privacy settings.
 */
function SettingsSecurity() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Security</h2>
      </div>
    </div>
  );
}
