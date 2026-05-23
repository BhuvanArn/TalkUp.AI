import { ChatAvatar } from '@/components/atoms/Chatbot/ChatAvatar';
import { ChatBubble } from '@/components/atoms/Chatbot/ChatBubble';
import { TypingIndicator } from '@/components/atoms/Chatbot/TypingIndicator';

/**
 * ChatMessage
 *
 * Combines ChatAvatar + ChatBubble + timestamp into a single message row.
 * Handles both 'ai' and 'user' layout (mirrored for user messages).
 * Optionally renders a TypingIndicator instead of a bubble when isTyping is true.
 *
 * @param props - ChatMessageProps
 * @returns A full message row as a React functional component.
 *
 * @example
 * <ChatMessage variant="ai" message="Hello!" timestamp="10:30" />
 * <ChatMessage variant="user" message="Tell me about interviews." timestamp="10:31" />
 * <ChatMessage variant="ai" isTyping />
 */

interface ChatMessageProps {
  /** The text content of the message */
  message?: string;
  /** 'ai' for assistant, 'user' for current user */
  variant: 'ai' | 'user';
  /** Formatted timestamp string (e.g. "10:30") */
  timestamp?: string;
  /** When true, renders a TypingIndicator instead of a bubble */
  isTyping?: boolean;
}

export const ChatMessage = ({
  message,
  variant,
  timestamp,
  isTyping = false,
}: ChatMessageProps) => {
  const isAi = variant === 'ai';

  return (
    <div
      className={`flex items-end gap-2 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <ChatAvatar variant={variant} />

      <div
        className={`flex flex-col gap-1 ${isAi ? 'items-start' : 'items-end'}`}
      >
        {isTyping ? (
          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm">
            <TypingIndicator />
          </div>
        ) : (
          message && <ChatBubble message={message} variant={variant} />
        )}

        {timestamp && !isTyping && (
          <span className="text-[10px] text-slate-400">{timestamp}</span>
        )}
      </div>
    </div>
  );
};
