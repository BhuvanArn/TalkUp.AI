import { createAuthGuard } from '@/utils/auth.guards';
import { Navigate, createFileRoute } from '@tanstack/react-router';

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
  return <Navigate to="/profile" />;
}
