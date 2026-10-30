import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">{t('settingsPages.integrations')}</h2>
      </div>
    </div>
  );
}
