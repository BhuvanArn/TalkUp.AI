import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/profile')({
  beforeLoad: createAuthGuard('/settings/profile'),
  component: SettingsProfile,
});

/**
 * Profile settings page
 *
 * Allows users to manage their profile information.
 */
function SettingsProfile() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Profile</h2>
      </div>
    </div>
  );
}
