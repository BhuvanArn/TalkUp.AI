import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/billing')({
  beforeLoad: createAuthGuard('/settings/billing'),
  component: SettingsBilling,
});

/**
 * Billing settings page
 *
 * Allows users to manage their billing and subscription information.
 */
function SettingsBilling() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Billing</h2>
      </div>
    </div>
  );
}
