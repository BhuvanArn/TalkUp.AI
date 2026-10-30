import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/**
 * @route /ai-chat
 * @description Landing page for the TalkUp AI assistant. The chat widget itself
 * is mounted app-wide from the root layout (#197), so it floats on every page;
 * this route is the nav entry point that explains it.
 */
export const Route = createFileRoute('/ai-chat')({
  beforeLoad: createAuthGuard('/ai-chat'),
  component: AiChatPage,
});

function AiChatPage() {
  const { t } = useTranslation('app');

  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <h1 className="text-2xl font-extrabold text-text mb-2">
          {t('chat.page.title')}
        </h1>
        <p className="text-sm text-text-weaker">{t('chat.page.description')}</p>
      </div>
    </div>
  );
}
