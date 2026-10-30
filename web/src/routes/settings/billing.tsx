import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">{t('settingsPages.billing')}</h2>
      </div>
    </div>
  );
}
