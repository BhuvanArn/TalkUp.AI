import { Button } from '@/components/atoms/button';
import { ChatInput } from '@/components/atoms/chatbot/ChatInput';
import { Icon } from '@/components/atoms/icon';

/**
 * ChatInputBar
 *
 * Combines ChatInput + a send button into a single input bar.
 * The send button is disabled when the input is empty or when isLoading is true.
 * Triggers onSend both via the button click and via the ChatInput Enter key handler.
 *
 * @param props - ChatInputBarProps
 * @returns A full input bar row as a React functional component.
 *
 * @example
 * <ChatInputBar
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 *   isLoading={isTyping}
 * />
 */

interface ChatInputBarProps {
  /** Current value of the text input */
  value: string;
  /** Callback fired on each keystroke */
  onChange: (value: string) => void;
  /** Callback fired when the user sends a message */
  onSend: () => void;
  /** When true, disables input and send button while AI is responding */
  isLoading?: boolean;
}

export const ChatInputBar = ({
  value,
  onChange,
  onSend,
  isLoading = false,
}: ChatInputBarProps) => {
  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="flex items-center gap-2 p-3 bg-surface border-t border-border">
      <ChatInput
        value={value}
        onChange={onChange}
        onSend={onSend}
        disabled={isLoading}
        placeholder="Ask a question..."
      />

      <Button
        circled
        size="sm"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-success)] text-white hover:opacity-90 hover:scale-105"
      >
        <Icon icon="send" size="sm" color="white" />
      </Button>
    </div>
  );
};
