/**
 * ChatBubble
 *
 * Renders a single message bubble inside the chatbot widget.
 * Supports two variants: 'ai' (left-aligned, surface background) and
 * 'user' (right-aligned, TalkUp gradient background).
 *
 * @param props - ChatBubbleProps
 * @returns A styled message bubble as a React functional component.
 *
 * @example
 * <ChatBubble variant="ai" message="Hello! How can I help?" />
 * <ChatBubble variant="user" message="Tell me about interviews." />
 */

interface ChatBubbleProps {
  /** The text content of the message */
  message: string;
  /** Visual variant: 'ai' for assistant messages, 'user' for user messages */
  variant: 'ai' | 'user';
}

export const ChatBubble = ({ message, variant }: ChatBubbleProps) => {
  const isAi = variant === 'ai';

  return (
    <div
      className={`max-w-[220px] px-3 py-2 rounded-2xl text-body-s leading-relaxed ${
        isAi
          ? 'bg-surface border border-border text-text rounded-bl-sm'
          : 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-success)] text-white rounded-br-sm'
      }`}
    >
      {message}
    </div>
  );
};
