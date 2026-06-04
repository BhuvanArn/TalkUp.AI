import { ChatWidget } from '@/components/organisms/chatbot/ChatWidget';
import { createFileRoute } from '@tanstack/react-router';

/**
 * @route /ai-chat
 * @description Entry point for the TalkUp AI chatbot session.
 * Renders the floating ChatWidget that persists across the page.
 */
export const Route = createFileRoute('/ai-chat')({
  component: AiChatPage,
});


function AiChatPage() {
  return (
    <div className="relative min-h-screen bg-[#F4F7FB] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">
          TalkUp AI Session
        </h1>
        <p className="text-sm text-slate-500">
          Click the button in the bottom-right corner to start chatting.
        </p>
      </div>

      <ChatWidget />
    </div>
  );
}
