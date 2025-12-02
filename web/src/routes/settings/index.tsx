import { createAuthGuard } from '@/utils/auth.guards';
import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/')({
  beforeLoad: createAuthGuard('/settings/'),
  component: SettingsIndex,
});

/**
 * Settings index page
 *
 * Redirects to the profile settings by default.
 */
function SettingsIndex() {
  // Redirect to profile by default
  return <Navigate to="/settings/profile" />;
}
