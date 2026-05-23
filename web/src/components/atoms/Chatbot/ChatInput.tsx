/**
 * ChatInput
 *
 * A controlled single-line text input for the chatbot message bar.
 * Triggers onSend when the user presses Enter (without Shift).
 *
 * @param props - ChatInputProps
 * @returns A styled text input as a React functional component.
 *
 * @example
 * <ChatInput
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 *   placeholder="Ask a question..."
 * />
 */

interface ChatInputProps {
  /** Current value of the input */
  value: string;
  /** Callback fired on each keystroke */
  onChange: (value: string) => void;
  /** Callback fired when the user presses Enter */
  onSend: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  placeholder = 'Ask a question...',
  disabled = false,
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      aria-label="Chat message input"
      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 placeholder:text-slate-400 focus:border-[#2B70C9] focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
};
