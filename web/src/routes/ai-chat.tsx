import { ChatWidget } from '@/components/organisms/chatbot/ChatWidget';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

/**
 * @route /ai-chat
 * @description Entry point for the TalkUp AI chatbot session.
 * Renders the floating ChatWidget scoped to this route.
 */
export const Route = createFileRoute('/ai-chat')({
  beforeLoad: createAuthGuard('/ai-chat'),
  component: AiChatPage,
});

function AiChatPage() {
  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-text mb-2">
          TalkUp AI Session
        </h1>
        <p className="text-sm text-text-weaker">
          Click the button in the bottom-right corner to start chatting.
        </p>
      </div>
      <ChatWidget />
    </div>
  );
}
