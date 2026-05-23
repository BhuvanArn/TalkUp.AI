import { ChatInput } from '@/components/atoms/Chatbot/ChatInput';

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
    <div className="flex items-center gap-2 p-3 bg-white border-t border-slate-100">
      <ChatInput
        value={value}
        onChange={onChange}
        onSend={onSend}
        disabled={isLoading}
        placeholder="Ask a question..."
      />

      <button
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${
          canSend
            ? 'bg-gradient-to-br from-[#2B70C9] to-[#1D9E75] hover:opacity-90 hover:scale-105 cursor-pointer'
            : 'bg-slate-200 cursor-not-allowed'
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
};
